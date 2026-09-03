import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { gigJsonLd, gigPageMetadata, loadGigSeo } from "@/lib/seo";

type GigLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: GigLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const gig = await loadGigSeo(id);
  if (!gig) {
    return { title: "החבילה לא נמצאה", robots: { index: false, follow: false } };
  }
  return gigPageMetadata(gig);
}

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
