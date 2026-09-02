import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "הודעות", template: "%s | הודעות | אבאל׳ה" },
  robots: { index: false, follow: false },
};

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
