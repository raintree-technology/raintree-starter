import type { MetadataRoute } from "next";
import { publicRoutes, site } from "@/lib/discovery";

export default function manifest(): MetadataRoute.Manifest {
  const shortcuts = publicRoutes.slice(0, 2).map((route) => ({
    name: route.title,
    short_name: route.title,
    description: route.description,
    url: route.path,
  }));

  return {
    id: site.url,
    name: site.name,
    short_name: site.name,
    description: site.shortDescription,
    lang: site.language,
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone"],
    orientation: "portrait-primary",
    background_color: "#fafafa",
    theme_color: "#18181b",
    categories: [site.category, "productivity", "utilities"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts,
    screenshots: [],
    prefer_related_applications: false,
    launch_handler: {
      client_mode: "navigate-existing",
    },
  };
}
