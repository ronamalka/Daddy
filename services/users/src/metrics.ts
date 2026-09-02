import { Counter } from "prom-client";
import { register } from "../../shared/metrics";

export const userRegistrations = new Counter({
  name: "daddy_user_registrations_total",
  help: "Total user registrations",
  labelNames: ["role", "method"] as const,
  registers: [register],
});

export const userLogins = new Counter({
  name: "daddy_user_logins_total",
  help: "Total user logins",
  labelNames: ["method"] as const,
  registers: [register],
});
