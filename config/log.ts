import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: env.NODE_ENV !== "production",
    },
  },
});
