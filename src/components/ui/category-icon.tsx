import {
  Wrench, Home, Package, Leaf, Monitor, Car, Phone, PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "assembly-and-installation": Wrench,
  "home-maintenance": Home,
  "moving-and-organization": Package,
  "garden-and-outdoor": Leaf,
  "tech-support": Monitor,
  "car-and-errands": Car,
  "admin-and-bureaucracy": Phone,
  "events-and-family": PartyPopper,
};

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

export function getCategoryIconName(slug: string): string {
  const names: Record<string, string> = {
    "assembly-and-installation": "wrench",
    "home-maintenance": "home",
    "moving-and-organization": "package",
    "garden-and-outdoor": "leaf",
    "tech-support": "monitor",
    "car-and-errands": "car",
    "admin-and-bureaucracy": "phone",
    "events-and-family": "party-popper",
  };
  return names[slug] || "wrench";
}
