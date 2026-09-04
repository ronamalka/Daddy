import { MetadataRoute } from "next";

/** Returns the web app manifest used when the site is installed on a phone. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "אבאל׳ה — אבא תמיד יודע לסדר",
    short_name: "אבאל׳ה",
    description: "מצא אבאל׳ה מנוסה שיעזור עם הרכבות, תיקונים, הובלות והוזלת חשבונות.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#2563EB",
    dir: "rtl",
    lang: "he",
    icons: [
      { src: "/logo.jpeg", sizes: "1792x2390", type: "image/jpeg" },
    ],
  };
}
