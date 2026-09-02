/**
 * Lightweight HTTP client for service-to-service calls.
 * Signs every request with the shared HMAC secret so the target
 * service's `requireInternal` middleware accepts it.
 */

import crypto from "crypto";
import { logger } from "./logger";

const INTER_SERVICE_SECRET = process.env.INTER_SERVICE_SECRET || "dev-secret-change-in-production";
const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || "http://localhost:4001";

function serviceSignature(): string {
  return crypto.createHmac("sha256", INTER_SERVICE_SECRET).update("service-call").digest("hex");
}

/** GET from a sibling service with the inter-service signature. */
export async function internalGet(
  serviceUrl: string,
  path: string,
): Promise<{ data: unknown; status: number }> {
  try {
    const res = await fetch(`${serviceUrl}${path}`, {
      method: "GET",
      headers: {
        "x-service-signature": serviceSignature(),
      },
    });
    const data = await res.json().catch(() => null);
    return { data, status: res.status };
  } catch (err) {
    logger.error({ err, url: `${serviceUrl}${path}` }, "Internal GET request failed");
    return { data: null, status: 502 };
  }
}

/** POST JSON to a sibling service with the inter-service signature. */
export async function internalPost(
  serviceUrl: string,
  path: string,
  body: Record<string, unknown>,
): Promise<{ data: unknown; status: number }> {
  try {
    const res = await fetch(`${serviceUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-service-signature": serviceSignature(),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    return { data, status: res.status };
  } catch (err) {
    logger.error({ err, url: `${serviceUrl}${path}` }, "Internal POST request failed");
    return { data: null, status: 502 };
  }
}

/** Send a notification via the users service. Fire-and-forget; logs failures. */
export async function sendNotification(payload: {
  userId: string;
  type: string;
  title: string;
  message: string;
  href?: string;
  entityId?: string;
}): Promise<void> {
  const { status } = await internalPost(USERS_SERVICE_URL, "/notifications/send", payload);
  if (status >= 400) {
    logger.warn({ type: payload.type, userId: payload.userId, status }, "Failed to send notification");
  }
}
