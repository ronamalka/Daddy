import { pageMetadata, HOME_DESCRIPTION, HOME_TITLE } from "@/lib/seo";
import { HomePage } from "./home-page";

export const metadata = pageMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: "/",
  absoluteTitle: true,
});

/** Homepage catalog: search, featured daddies, and how the site works. */
export default function Page() {
  return <HomePage />;
}
