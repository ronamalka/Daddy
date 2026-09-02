import pino from "pino";

const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");

export const logger = pino({
  level: LOG_LEVEL,
  base: { service: "bff" },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(process.env.NODE_ENV !== "production" && {
    transport: { target: "pino/file", options: { destination: 1 } },
  }),
});
