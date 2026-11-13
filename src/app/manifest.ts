import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BrokerDesk",
    short_name: "BrokerDesk",
    description: "Leads, listings and WhatsApp sharing for real estate brokers",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f4",
    theme_color: "#0f766e",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
