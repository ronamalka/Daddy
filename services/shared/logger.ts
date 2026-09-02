import pino from "pino";
import pinoHttp from "pino-http";

const SERVICE_NAME = process.env.SERVICE_NAME || "unknown";
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");

export const logger = pino({
  level: LOG_LEVEL,
  base: { service: SERVICE_NAME },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(process.env.NODE_ENV !== "production" && {
    transport: { target: "pino/file", options: { destination: 1 } },
  }),
});

export function createRequestLogger() {
  return pinoHttp({
    logger,
    autoLogging: {
      ignore: (req: { url?: string }) => req.url === "/health" || req.url === "/metrics",
    },
    customProps: (req: { headers?: Record<string, string | string[] | undefined>; id?: string }) => ({
      requestId: req.headers?.["x-request-id"] || req.id,
    }),
    serializers: {
      req: (req: { method?: string; url?: string; remoteAddress?: string }) => ({
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      }),
      res: (res: { statusCode?: number }) => ({
        statusCode: res.statusCode,
      }),
    },
  });
}
