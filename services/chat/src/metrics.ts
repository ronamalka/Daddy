import { Counter } from "prom-client";
import { register } from "../../shared/metrics";

export const messagesSent = new Counter({
  name: "daddy_messages_sent_total",
  help: "Total chat messages sent",
  registers: [register],
});

export const violationsBlocked = new Counter({
  name: "daddy_chat_violations_blocked_total",
  help: "Total chat violations blocked",
  labelNames: ["pattern_type"] as const,
  registers: [register],
});
