import { Counter } from "prom-client";
import { register } from "../../shared/metrics";

export const ordersCreated = new Counter({
  name: "daddy_orders_created_total",
  help: "Total orders created",
  labelNames: ["category"] as const,
  registers: [register],
});

export const ordersCompleted = new Counter({
  name: "daddy_orders_completed_total",
  help: "Total orders completed",
  labelNames: ["category"] as const,
  registers: [register],
});

export const commissionCollected = new Counter({
  name: "daddy_commission_collected_total",
  help: "Total commission collected in agorot",
  labelNames: ["tier"] as const,
  registers: [register],
});
