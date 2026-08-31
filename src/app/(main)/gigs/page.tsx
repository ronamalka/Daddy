import { redirect } from "next/navigation";
import { catalogBrowsePath } from "@/lib/services";

/** `/gigs` is not a second marketplace — send buyers to the people + prices catalog. */
export default async function GigsBrowseRedirect({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  redirect(catalogBrowsePath(category));
}
