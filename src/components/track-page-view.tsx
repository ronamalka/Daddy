"use client";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export function TrackPageView({ event, data }: { event: string; data?: Record<string, string | number | boolean> }) {
  useEffect(() => {
    trackEvent(event, data);
  }, [event]);
  return null;
}
