import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Smart Tips - Football Predictions & VIP Slips",
    short_name: "Smart Tips",
    description: "Free daily football predictions, match analysis and premium VIP slips.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f2ed",
    theme_color: "#f4f2ed",
    icons: [
      { src: "/brand/smart-tips-icon.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
