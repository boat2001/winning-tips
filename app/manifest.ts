import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Winning Tips - Football Predictions & VIP Slips",
    short_name: "Winning Tips",
    description: "Free daily football predictions, match analysis and premium VIP slips.",
    start_url: "/",
    display: "standalone",
    // The splash ground is navy, matching the stadium ground. It was still the
    // retired newsprint cream, which mattered little behind an opaque white
    // icon tile and matters a lot now the icon is transparent — this is the
    // colour that shows through it on the splash screen.
    background_color: "#001938",
    // White, continuing the top bar an installed app opens under on a phone.
    theme_color: "#ffffff",
    icons: [
      // purpose "any" (the default): the artwork runs edge to edge, so it has no
      // safe zone to spare and must not be offered as maskable — Android would
      // crop into the mark to fit its own shape.
      { src: "/brand/winning-tips-icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
