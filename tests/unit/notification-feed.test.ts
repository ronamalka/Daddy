import { describe, it, expect } from "vitest";
import { mapPersistedNotification, mergeNotificationFeed } from "@/lib/notification-feed";

describe("mapPersistedNotification", () => {
  it("maps readAt into a boolean read flag", () => {
    expect(
      mapPersistedNotification({
        id: "n1",
        type: "NEW_NEARBY_REQUEST",
        title: "בקשה חדשה באזור שלך",
        message: "הרכבת ארון בחולון",
        href: "/requests/req-1",
        createdAt: "2026-08-31T10:00:00.000Z",
        readAt: null,
      })
    ).toMatchObject({ id: "n1", type: "NEW_NEARBY_REQUEST", read: false });

    expect(
      mapPersistedNotification({
        id: "n2",
        type: "NEW_NEARBY_REQUEST",
        title: "t",
        message: "m",
        href: "/requests/req-2",
        createdAt: new Date("2026-08-31T11:00:00.000Z"),
        readAt: new Date("2026-08-31T12:00:00.000Z"),
      }).read
    ).toBe(true);
  });
});

describe("mergeNotificationFeed", () => {
  it("mixes persisted nearby-request rows with derived order alerts, newest first", () => {
    const merged = mergeNotificationFeed(
      [
        mapPersistedNotification({
          id: "persist-1",
          type: "NEW_NEARBY_REQUEST",
          title: "בקשה חדשה",
          message: "חולון",
          href: "/requests/r1",
          createdAt: "2026-08-31T12:00:00.000Z",
          readAt: null,
        }),
      ],
      [
        {
          id: "new-order-1",
          type: "NEW_ORDER",
          title: "הזמנה חדשה!",
          message: "₪100",
          href: "/orders/o1",
          createdAt: "2026-08-31T11:00:00.000Z",
          read: false,
        },
      ]
    );
    expect(merged.map((row) => row.id)).toEqual(["persist-1", "new-order-1"]);
  });

  it("caps the feed at 20", () => {
    const persisted = Array.from({ length: 15 }, (_, i) =>
      mapPersistedNotification({
        id: `p${i}`,
        type: "NEW_NEARBY_REQUEST",
        title: "t",
        message: "m",
        href: `/requests/${i}`,
        createdAt: `2026-08-31T12:${String(i).padStart(2, "0")}:00.000Z`,
      })
    );
    const derived = Array.from({ length: 15 }, (_, i) => ({
      id: `d${i}`,
      type: "NEW_ORDER",
      title: "t",
      message: "m",
      href: `/orders/${i}`,
      createdAt: `2026-08-31T10:${String(i).padStart(2, "0")}:00.000Z`,
      read: false,
    }));
    expect(mergeNotificationFeed(persisted, derived)).toHaveLength(20);
  });
});
