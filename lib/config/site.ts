export const siteConfig = {
  name: "Smart Tips",
  shortName: "ST",
  tagline: "Read the game. Win the cash.",
  description:
    "Daily football predictions with the market, the selection and the reasoning shown in full. Free tips every day, VIP slips when you want them.",
  locale: "en_GH",
  navigation: [
    { label: "Predictions", href: "/predictions" },
    { label: "Results", href: "/results" },
    { label: "Performance", href: "/performance" },
    { label: "VIP", href: "/vip" },
  ],
} as const;

export const communityLinks = {
  telegram: "https://t.me/+fSf79FiGlz05NDg0",
  whatsapp: "https://wa.me/message/NBBEVPL4RCPTJ1",
} as const;

export function getSiteUrl() {
  return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
}

export type SiteConfig = typeof siteConfig;
