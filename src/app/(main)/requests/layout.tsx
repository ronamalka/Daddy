import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "בקשות", template: "%s | בקשות | אבאל׳ה" },
  robots: { index: false, follow: false },
};

export default function RequestsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
