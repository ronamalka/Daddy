import { pageMetadata, HOME_DESCRIPTION, HOME_TITLE } from "@/lib/seo";
import { fetchFeaturedDaddies, fetchRecentReviews, fetchRequestTeasers } from "@/lib/homepage-data";
import { HomePage } from "./home-page";

export const metadata = pageMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

/** Homepage catalog: search, featured daddies, and how the site works. */
export default async function Page() {
  const [featuredDaddies, liveReviews, requestTeasers] = await Promise.all([
    fetchFeaturedDaddies(),
    fetchRecentReviews(),
    fetchRequestTeasers(),
  ]);

  return (
    <HomePage
      initialFeaturedDaddies={featuredDaddies}
      initialLiveReviews={liveReviews}
      initialRequestTeasers={requestTeasers}
    />
  );
}
