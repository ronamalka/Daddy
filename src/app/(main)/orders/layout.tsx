import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s | הזמנות | אבאל׳ה", default: "ההזמנות שלי" },
  robots: { index: false, follow: false },
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
