import type { MetadataRoute } from "next";

// Web app manifest. Makes Mismatched installable on Android (Chrome) and
// iOS (via Safari's "Add to Home Screen"). On install, the app opens in a
// standalone window without the browser chrome.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mismatched",
    short_name: "Mismatched",
    description: "A quieter dating app — prompts over poses, real conversations.",
    start_url: "/discover",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFFFFF",
    theme_color: "#1C1B19",
    icons: [
      {
        src: "/icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-192-maskable",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-512-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
