import { PrismaClient } from "@prisma/client";
import { env } from "~/config/env";

const globalAny: any = global;

export const prismaClient: PrismaClient =
  globalAny.prismaClient || new PrismaClient();

if (env.NODE_ENV !== "production") {
  globalAny.prismaClient = prismaClient;
}
