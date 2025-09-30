import * as z from "zod/v4";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
  DEBUG: z.string().optional(),

  DATABASE_URL: z.string(),

  FIRST_ADMIN_EMAIL: z.email(),

  // JWT Configuration
  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
