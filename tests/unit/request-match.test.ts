import { describe, it, expect } from "vitest";
import {
  MAX_NEARBY_REQUEST_NOTIFY,
  NOTIFICATION_TYPE_NEARBY_REQUEST,
  nearbyRequestNotification,
  parseUserServiceInput,
  pickMatchedSellers,
  sellerMatchTier,
} from "../../services/users/src/request-match";

const HOLON = 6600;
const NETANYA = 7400;
const CENTER = 4;

describe("sellerMatchTier", () => {
  it("matches a seller who listed the request city", () => {
    expect(
      sellerMatchTier([{ cityCode: HOLON, districtCode: CENTER }], { cityCode: HOLON, districtCode: CENTER })
    ).toBe("city");
  });

  it("matches a district-wide seller when the city is in that district", () => {
    expect(
      sellerMatchTier([{ cityCode: null, districtCode: CENTER }], { cityCode: HOLON, districtCode: CENTER })
    ).toBe("district");
  });

  it("does not match a Netanya-only daddy for a Holon job in the same district", () => {
    expect(
      sellerMatchTier([{ cityCode: NETANYA, districtCode: CENTER }], { cityCode: HOLON, districtCode: CENTER })
    ).toBeNull();
  });

  it("when the request has no city, only district-wide sellers match", () => {
    expect(
      sellerMatchTier([{ cityCode: HOLON, districtCode: CENTER }], { cityCode: null, districtCode: CENTER })
    ).toBeNull();
    expect(
      sellerMatchTier([{ cityCode: null, districtCode: CENTER }], { cityCode: null, districtCode: CENTER })
    ).toBe("district");
  });

  it("returns null when there is no location on the request", () => {
    expect(sellerMatchTier([{ cityCode: HOLON, districtCode: CENTER }], { cityCode: null, districtCode: null })).toBeNull();
  });
});

describe("pickMatchedSellers", () => {
  it("puts city matches before district-wide fill and caps the list", () => {
    const citySellers = Array.from({ length: 5 }, (_, i) => ({
      id: `city-${i}`,
      areas: [{ cityCode: HOLON, districtCode: CENTER }],
    }));
    const districtSellers = Array.from({ length: 30 }, (_, i) => ({
      id: `district-${i}`,
      areas: [{ cityCode: null, districtCode: CENTER }],
    }));
    const leak = { id: "netanya", areas: [{ cityCode: NETANYA, districtCode: CENTER }] };
    const picked = pickMatchedSellers([...districtSellers, leak, ...citySellers], {
      cityCode: HOLON,
      districtCode: CENTER,
    });
    expect(picked).toHaveLength(MAX_NEARBY_REQUEST_NOTIFY);
    expect(picked.slice(0, 5).every((row) => row.match === "city")).toBe(true);
    expect(picked.slice(5).every((row) => row.match === "district")).toBe(true);
    expect(picked.some((row) => row.id === "netanya")).toBe(false);
  });

  it("caps city-only floods at MAX_NEARBY_REQUEST_NOTIFY", () => {
    const citySellers = Array.from({ length: 40 }, (_, i) => ({
      id: `c${i}`,
      areas: [{ cityCode: HOLON, districtCode: CENTER }],
    }));
    const picked = pickMatchedSellers(citySellers, { cityCode: HOLON, districtCode: CENTER });
    expect(picked).toHaveLength(MAX_NEARBY_REQUEST_NOTIFY);
    expect(picked.every((row) => row.match === "city")).toBe(true);
  });
});

describe("nearbyRequestNotification", () => {
  it("uses NEW_NEARBY_REQUEST so WhatsApp (#52) can consume the same event later", () => {
    const note = nearbyRequestNotification({
      requestId: "req-1",
      title: "הרכבת ארון",
      serviceSlug: "furniture-assembly",
      cityName: "חולון",
      districtName: "המרכז",
    });
    expect(note.type).toBe(NOTIFICATION_TYPE_NEARBY_REQUEST);
    expect(note.type).toBe("NEW_NEARBY_REQUEST");
    expect(note.href).toBe("/requests/req-1");
    expect(note.entityId).toBe("req-1");
    expect(note.title).toBe("בקשה חדשה באזור שלך");
    expect(note.message).toContain("חולון");
    expect(note.message).toContain("הרכבת רהיטים");
    expect(note.payload).toMatchObject({
      requestId: "req-1",
      serviceSlug: "furniture-assembly",
      eventType: "NEW_NEARBY_REQUEST",
    });
  });
});

describe("parseUserServiceInput", () => {
  it("accepts slug strings and object rows, preserving mute flags", () => {
    expect(parseUserServiceInput(["tv-mounting", "tv-mounting", "lawn-mowing"])).toEqual([
      { serviceSlug: "tv-mounting" },
      { serviceSlug: "lawn-mowing" },
    ]);
    expect(
      parseUserServiceInput([{ serviceSlug: "tv-mounting", alertsMuted: true }, { serviceSlug: "lawn-mowing" }])
    ).toEqual([
      { serviceSlug: "tv-mounting", alertsMuted: true },
      { serviceSlug: "lawn-mowing" },
    ]);
  });

  it("returns null when the payload is not an array", () => {
    expect(parseUserServiceInput({ services: [] })).toBeNull();
  });
});
