import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { loadSellerSeo, sellerJsonLd, sellerPageMetadata } from "@/lib/seo";

type SellerLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: SellerLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const seller = await loadSellerSeo(id);
  if (!seller) {
    return { title: "הפרופיל לא נמצא", robots: { index: false, follow: false } };
  }
  return sellerPageMetadata(seller);
}

export default async function SellerProfileLayout({ children, params }: SellerLayoutProps) {
  const { id } = await params;
  const seller = await loadSellerSeo(id);
  return (
    <>
      {seller ? <JsonLd data={sellerJsonLd(seller)} /> : null}
      {children}
    </>
  );
}
