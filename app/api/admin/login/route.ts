import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { prismaClient } from "~/prisma/client";
import { bcryptHashProvider } from "~/utils/bcrypt";
import { signToken } from "~/utils/jwt";

const app = new Hono();

const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

app.post("/", zValidator("json", loginSchema), async (c) => {
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
});

export const GET = app.fetch;
export const POST = app.fetch;
