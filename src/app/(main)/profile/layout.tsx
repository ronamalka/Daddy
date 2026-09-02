import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s | פרופיל | אבאל׳ה", default: "הפרופיל שלי" },
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
