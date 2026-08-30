"use client";

import {
  Wrench, House, Package, Leaf, Monitor, Car, Phone, Confetti,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "assembly-and-installation": Wrench,
  "home-maintenance": House,
  "moving-and-organization": Package,
  "garden-and-outdoor": Leaf,
  "tech-support": Monitor,
  "car-and-errands": Car,
  "admin-and-bureaucracy": Phone,
  "events-and-family": Confetti,
};

/** Icon for a service category slug, or a wrench if the slug is unknown. */
export function CategoryIcon({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const Icon = ICONS[slug] || Wrench;
  return <Icon className={cn("h-5 w-5", className)} />;
}

/** Returns a short English name for a category icon, used in tests or logs. */
export function getCategoryIconName(slug: string): string {
  const names: Record<string, string> = {
    "assembly-and-installation": "wrench",
    "home-maintenance": "house",
    "moving-and-organization": "package",
    "garden-and-outdoor": "leaf",
    "tech-support": "monitor",
    "car-and-errands": "car",
    "admin-and-bureaucracy": "phone",
    "events-and-family": "confetti",
  };
  return names[slug] || "wrench";
}
