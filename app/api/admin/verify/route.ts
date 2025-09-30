import { Hono } from "hono";
import { requireAdminAuth } from "~/utils/auth";

const app = new Hono();

// Example protected route
app.get("/", async (c) => {
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

export const GET = app.fetch;
