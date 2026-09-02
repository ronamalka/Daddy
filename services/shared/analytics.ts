/** Log a business event for analytics. Fire-and-forget — never blocks the request. */
export function logEvent(
  prisma: any,
  event: {
    eventName: string;
    eventCategory: string;
    actorId?: string;
    actorRole?: string;
    entityType?: string;
    entityId?: string;
    properties?: Record<string, any>;
  }
): void {
  // Fire-and-forget: don't await, don't block
  prisma.analyticsEvent.create({
    data: {
      eventName: event.eventName,
      eventCategory: event.eventCategory,
      actorId: event.actorId,
      actorRole: event.actorRole,
      entityType: event.entityType,
      entityId: event.entityId,
      properties: event.properties || {},
    },
  }).catch((err: Error) => {
    // Log but don't crash — analytics should never break business logic
    console.error("Failed to log analytics event:", err.message);
  });
}
