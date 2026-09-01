export const DISTRICTS: Record<number, string> = {
  1: "ירושלים",
  2: "הצפון",
  3: "חיפה",
  4: "המרכז",
  5: "תל אביב",
  6: "הדרום",
  7: "יהודה והשומרון",
};

/** Get the district number from a government region code. */
export function getDistrictCode(regionCode: number): number {
  return Math.floor(regionCode / 10);
}

/** Return the Hebrew name for a district code, or a fallback if it is unknown. */
export function getDistrictName(districtCode: number): string {
  return DISTRICTS[districtCode] || "לא ידוע";
}
