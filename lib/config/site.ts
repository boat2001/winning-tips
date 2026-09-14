export const siteConfig = {
  name: "Winning Tips",
  shortName: "WT",
  tagline: "Get the tips. Win the cash.",
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

/**
 * The canonical origin. A blank NEXT_PUBLIC_APP_URL counts as unset (a Vercel
 * variable saved with no value arrives as ""), and on Vercel the project's
 * production domain, then the deployment URL, stand in before localhost.
 */
export function getSiteUrl(environment: Record<string, string | undefined> = process.env) {
  const configured = environment.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return new URL(configured);
  const vercelHost = environment.VERCEL_PROJECT_PRODUCTION_URL?.trim() || environment.VERCEL_URL?.trim();
  if (vercelHost) return new URL(`https://${vercelHost}`);
  return new URL("http://localhost:3000");
}

export type SiteConfig = typeof siteConfig;
