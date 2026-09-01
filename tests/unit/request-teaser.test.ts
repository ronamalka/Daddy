import { describe, it, expect } from "vitest";
import {
  REQUEST_TEASER_TAKE,
  mapRequestTeasers,
  requestTeaserWhere,
  toRequestTeaser,
} from "../../services/shared/request-teaser";
import { relativeTimeHe } from "@/lib/request-teaser";

const createdAt = "2026-08-01T10:00:00.000Z";

const publicRow = {
  id: "sreq-1",
  title: "צריך עזרה בהרכבת ארון גדול",
  serviceSlug: "furniture-assembly",
  cityName: "תל אביב - יפו",
  districtName: "תל אביב",
  createdAt,
};

describe("requestTeaserWhere", () => {
  it("lists only OPEN requests that are not unlisted", () => {
    expect(requestTeaserWhere()).toEqual({ status: "OPEN", unlisted: false });
  });
});

describe("toRequestTeaser", () => {
  it("keeps city, service, and age, and drops private fields", () => {
    const teaser = toRequestTeaser({
      ...publicRow,
      description: "קניתי ארון PAX וכתובת הרצל 12",
      buyerId: "seed-user-buyer1",
      buyer: { name: "דנה כהן" },
      phone: "050-0000000",
      street: "הרצל 12",
      photos: ["https://example.com/photo.jpg"],
      slotStart: "2026-08-02T08:00:00.000Z",
    });
    expect(teaser).toEqual(publicRow);
    const json = JSON.stringify(teaser);
    expect(json).not.toMatch(/PAX|דנה|050|הרצל|photo|buyer|slotStart|description/i);
  });

  it("returns null without id, title, or createdAt", () => {
    expect(toRequestTeaser({ title: "x", createdAt })).toBeNull();
    expect(toRequestTeaser({ id: "1", createdAt })).toBeNull();
    expect(toRequestTeaser({ id: "1", title: "x" })).toBeNull();
  });

  it("serializes Date createdAt to ISO", () => {
    expect(toRequestTeaser({ ...publicRow, createdAt: new Date(createdAt) })?.createdAt).toBe(createdAt);
  });
});

describe("mapRequestTeasers", () => {
  it("drops invalid rows and caps the public list", () => {
    const rows = Array.from({ length: REQUEST_TEASER_TAKE + 3 }, (_, i) => ({
      ...publicRow,
      id: `sreq-${i}`,
    }));
    expect(mapRequestTeasers([...rows, { id: "bad" }])).toHaveLength(REQUEST_TEASER_TAKE);
    expect(mapRequestTeasers(null)).toEqual([]);
  });
});

describe("relativeTimeHe", () => {
  const now = new Date("2026-08-01T12:00:00.000Z");

  it("formats minutes, hours, yesterday, and days", () => {
    expect(relativeTimeHe("2026-08-01T11:59:30.000Z", now)).toBe("עכשיו");
    expect(relativeTimeHe("2026-08-01T11:40:00.000Z", now)).toBe("לפני 20 דק׳");
    expect(relativeTimeHe("2026-08-01T09:00:00.000Z", now)).toBe("לפני 3 שע׳");
    expect(relativeTimeHe("2026-07-31T12:00:00.000Z", now)).toBe("אתמול");
    expect(relativeTimeHe("2026-07-29T12:00:00.000Z", now)).toBe("לפני 3 ימים");
  });
});
