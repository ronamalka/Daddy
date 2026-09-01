import { serializeJsonLd } from "@/lib/seo";

/** Embeds a schema.org JSON-LD script for crawlers. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
