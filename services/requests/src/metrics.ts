import { Counter } from "prom-client";
import { register } from "../../shared/metrics";

export const requestsCreated = new Counter({
  name: "daddy_service_requests_created_total",
  help: "Total service requests created",
  labelNames: ["category"] as const,
  registers: [register],
});

export const quotesSent = new Counter({
  name: "daddy_quotes_sent_total",
  help: "Total quotes sent by sellers",
  registers: [register],
});
