export const siteConfig = {
  name: "Winning Tips",
  shortName: "WT",
  tagline: "Predict. Win. Together.",
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
  telegram: "https://t.me/+UfUsHOHnJKUxNjI0",
  whatsapp: "https://whatsapp.com/channel/0029Vb8l5L72ER6qQyuq9i0p",
} as const;

export function getSiteUrl() {
  return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
}

export type SiteConfig = typeof siteConfig;
