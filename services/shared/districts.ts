export const DISTRICTS: Record<number, string> = {
  1: "ירושלים",
  2: "הצפון",
  3: "חיפה",
  4: "המרכז",
  5: "תל אביב",
  6: "הדרום",
  7: "יהודה והשומרון",
};

export function getDistrictCode(regionCode: number): number {
  return Math.floor(regionCode / 10);
}

export function getDistrictName(districtCode: number): string {
  return DISTRICTS[districtCode] || "לא ידוע";
}
