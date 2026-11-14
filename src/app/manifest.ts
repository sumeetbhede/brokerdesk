import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EstatePal",
    short_name: "EstatePal",
    description: "Everything your property business needs",
    start_url: "/",
    display: "standalone",
    background_color: "#0f0f0f",
    theme_color: "#0f0f0f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
