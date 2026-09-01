import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { gigJsonLd, gigPageMetadata, loadGigSeo } from "@/lib/seo";

type GigLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

/** Per-package title, description, and Service JSON-LD. */
export async function generateMetadata({ params }: GigLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const gig = await loadGigSeo(id);
  if (!gig) {
    return { title: "החבילה לא נמצאה", robots: { index: false, follow: false } };
  }
  return gigPageMetadata(gig);
}

/** Wraps a public package page with crawler metadata. */
export default async function GigDetailLayout({ children, params }: GigLayoutProps) {
  const { id } = await params;
  const gig = await loadGigSeo(id);
  return (
    <>
      {gig ? <JsonLd data={gigJsonLd(gig)} /> : null}
      {children}
    </>
  );
}
