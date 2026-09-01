export interface Provider {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  city: string | null;
  services: string[];
  serviceAreas: { districtName: string; cityName: string | null; districtCode: number }[];
  completedOrders?: number;
  reviewCount: number;
  avgRating?: number;
  startingPrice?: number | null;
  hasFixedPrice?: boolean;
  acceptsQuotes?: boolean;
  matchTier?: "city" | "district" | null;
  distanceKm?: number | null;
}

export interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  serviceSlug: string | null;
  districtName: string | null;
  cityName: string | null;
  status: string;
  createdAt: string;
  slotStart?: string | null;
  slotEnd?: string | null;
  buyer?: { id: string; name: string };
  _count?: { responses: number };
}

export interface RequestTeaser {
  id: string;
  title: string;
  serviceSlug: string | null;
  cityName: string | null;
  districtName: string | null;
  createdAt: string;
}

export interface FeaturedDaddy {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  city: string | null;
  services: string[];
  serviceAreas: { districtName: string; cityName: string | null }[];
  completedOrders: number;
  reviewCount: number;
  avgRating: number;
  startingPrice: number | null;
}

export interface LiveReview {
  id: string;
  rating: number;
  comment: string;
  ratingAttitude: number | null;
  ratingTimeliness: number | null;
  ratingPrice: number | null;
  ratingQuality: number | null;
  createdAt: string;
  user: { name: string; city: string | null };
  gig: { title: string; user: { name: string } };
}
