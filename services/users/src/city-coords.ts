export interface LatLng {
  lat: number;
  lng: number;
}

/** CBS city-code centroids for distance sort. Unknown codes fall back to the district. */
export const CITY_COORDS: Record<number, LatLng> = {
  70: { lat: 31.804, lng: 34.655 }, // אשדוד
  1031: { lat: 31.525, lng: 34.596 }, // שדרות
  1200: { lat: 31.907, lng: 35.008 }, // מודיעין-מכבים-רעות
  2200: { lat: 31.069, lng: 35.033 }, // דימונה
  2600: { lat: 29.557, lng: 34.951 }, // אילת
  2630: { lat: 31.61, lng: 34.764 }, // קריית גת
  2800: { lat: 33.208, lng: 35.57 }, // קריית שמונה
  3000: { lat: 31.768, lng: 35.214 }, // ירושלים
  4000: { lat: 32.794, lng: 34.99 }, // חיפה
  5000: { lat: 32.085, lng: 34.782 }, // תל אביב-יפו
  6100: { lat: 32.085, lng: 34.834 }, // בני ברק
  6200: { lat: 32.013, lng: 34.748 }, // בת ים
  6300: { lat: 32.07, lng: 34.812 }, // גבעתיים
  6400: { lat: 32.164, lng: 34.843 }, // הרצליה
  6500: { lat: 32.096, lng: 34.952 }, // ראש העין
  6600: { lat: 32.011, lng: 34.774 }, // חולון
  6700: { lat: 32.793, lng: 35.531 }, // טבריה
  6900: { lat: 32.175, lng: 34.907 }, // כפר סבא
  7100: { lat: 31.669, lng: 34.571 }, // אשקלון
  7300: { lat: 32.7, lng: 35.297 }, // נצרת
  7400: { lat: 32.321, lng: 34.853 }, // נתניה
  7600: { lat: 32.928, lng: 35.082 }, // עכו
  7900: { lat: 32.085, lng: 34.888 }, // פתח תקווה
  8300: { lat: 31.973, lng: 34.793 }, // ראשון לציון
  8400: { lat: 31.894, lng: 34.812 }, // רחובות
  8500: { lat: 31.929, lng: 34.799 }, // נס ציונה
  8600: { lat: 32.082, lng: 34.814 }, // רמת גן
  8700: { lat: 32.185, lng: 34.871 }, // רעננה
  9000: { lat: 31.253, lng: 34.792 }, // באר שבע
  9100: { lat: 33.006, lng: 35.094 }, // נהריה
  9400: { lat: 32.15, lng: 34.888 }, // הוד השרון
};

/** Approximate district centroids when a city code is missing from CITY_COORDS. */
export const DISTRICT_COORDS: Record<number, LatLng> = {
  1: { lat: 31.768, lng: 35.214 },
  2: { lat: 32.796, lng: 35.265 },
  3: { lat: 32.794, lng: 34.99 },
  4: { lat: 32.084, lng: 34.888 },
  5: { lat: 32.085, lng: 34.782 },
  6: { lat: 31.253, lng: 34.792 },
  7: { lat: 31.952, lng: 35.233 },
};

/** Looks up a city centroid, then the district, so Eilat is not treated as Be'er Sheva. */
export function coordsFor(cityCode?: number | null, districtCode?: number | null): LatLng | null {
  if (cityCode && CITY_COORDS[cityCode]) return CITY_COORDS[cityCode];
  if (districtCode && DISTRICT_COORDS[districtCode]) return DISTRICT_COORDS[districtCode];
  return null;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance in kilometers. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
