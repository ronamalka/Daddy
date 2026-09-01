import { describe, it, expect } from "vitest";
import { parseUserServiceList, userServiceSlugs } from "@/lib/user-services";

describe("parseUserServiceList", () => {
  it("reads the object shape returned after mute flags were added", () => {
    expect(
      parseUserServiceList([
        { serviceSlug: "tv-mounting", alertsMuted: true },
        { serviceSlug: "lawn-mowing", alertsMuted: false },
      ])
    ).toEqual([
      { serviceSlug: "tv-mounting", alertsMuted: true },
      { serviceSlug: "lawn-mowing", alertsMuted: false },
    ]);
  });

  it("still accepts the older string[] payload", () => {
    expect(parseUserServiceList(["tv-mounting", "lawn-mowing"])).toEqual([
      { serviceSlug: "tv-mounting", alertsMuted: false },
      { serviceSlug: "lawn-mowing", alertsMuted: false },
    ]);
    expect(userServiceSlugs(["tv-mounting"])).toEqual(["tv-mounting"]);
  });
});
