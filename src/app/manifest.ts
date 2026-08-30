import { MetadataRoute } from "next";

/** Returns the web app manifest used when the site is installed on a phone. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "אבאל׳ה — שוק פרילנסרים",
    short_name: "אבאל׳ה",
    description: "מצא לך אבאל׳ה שיעזור עם מה שאתה צריך היום",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#6C5CE7",
    dir: "rtl",
    lang: "he",
    icons: [
      { src: "/logo.jpeg", sizes: "1792x2390", type: "image/jpeg" },
    ],
  };
}
