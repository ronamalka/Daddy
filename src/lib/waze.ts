/** Waze universal search-and-navigate link (no live GPS). */
const WAZE_UL = "https://waze.com/ul";

export type WazeAddress = {
  street?: string | null;
  cityName?: string | null;
  districtName?: string | null;
};

/** Builds a Waze deep link from street + city. Floor is never part of the query. */
export function buildWazeNavigateUrl(address: WazeAddress): string | null {
  const street = address.street?.trim();
  if (!street) return null;
  const city = address.cityName?.trim() || address.districtName?.trim() || "";
  const q = city ? `${street}, ${city}` : street;
  return `${WAZE_UL}?${new URLSearchParams({ q, navigate: "yes" }).toString()}`;
}

/** True when the assigned daddy should see Navigate in Waze on a booked job. */
export function canShowSellerWaze(opts: {
  isSeller: boolean;
  status?: string | null;
  street?: string | null;
  streetVisible?: boolean;
}): boolean {
  if (!opts.isSeller) return false;
  if (opts.status === "CANCELLED") return false;
  if (opts.streetVisible === false) return false;
  return Boolean(opts.street?.trim());
}
