import { env } from "~/config/env";
import { logger } from "~/config/log";
import { bcryptHashProvider } from "~/utils/bcrypt";
import { prismaClient } from "./client";

process.env.DATABASE_URL = env.DATABASE_URL;
global.process.env.DATABASE_URL = env.DATABASE_URL;

const hasAnyAdmin = await prismaClient.admin.findFirst();
const firstAdminEmail = env.FIRST_ADMIN_EMAIL;
if (!hasAnyAdmin && firstAdminEmail) {
  logger.info(`Criando o primeiro admin com o email: ${firstAdminEmail}`);
  await prismaClient.admin.create({
    data: {
      email: firstAdminEmail,
      name: "Admin",
      password: await bcryptHashProvider.generateHash("1234512345"),
    },
  });
}
