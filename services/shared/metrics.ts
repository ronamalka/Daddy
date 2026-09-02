import { Registry, collectDefaultMetrics, Counter, Histogram } from "prom-client";

const register = new Registry();

collectDefaultMetrics({ register, prefix: "daddy_" });

export const httpRequestsTotal = new Counter({
  name: "daddy_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status_code", "service"] as const,
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: "daddy_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code", "service"] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export { register };

/** Express middleware to track request metrics */
export function metricsMiddleware(serviceName: string) {
  return (req: any, res: any, next: any) => {
    if (req.path === "/health" || req.path === "/metrics") {
      return next();
    }
    const end = httpRequestDuration.startTimer();
    res.on("finish", () => {
      const route = req.route?.path || req.path;
      const labels = {
        method: req.method,
        route,
        status_code: String(res.statusCode),
        service: serviceName,
      };
      httpRequestsTotal.inc(labels);
      end(labels);
    });
    next();
  };
}

/** Express handler to expose /metrics endpoint */
export function metricsHandler() {
  return async (_req: any, res: any) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  };
}
