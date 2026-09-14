import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { getSiteUrl, siteConfig } from "@/lib/config/site";

const brand = localFont({
  src: [
    { path: "../public/fonts/poppins-regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/poppins-semibold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/poppins-bold.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/poppins-extrabold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-poppins", display: "swap",
});
const script = localFont({src:"../public/fonts/caveat.ttf", variable:"--font-caveat", display:"swap", preload:false});

const siteUrl = getSiteUrl();
const headline = `${siteConfig.name} - Daily Football Predictions & VIP Slips`;

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: headline,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name, url: siteUrl }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "sports",
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  openGraph: {
    type: "website",
    url: "/",
    siteName: siteConfig.name,
    title: headline,
    description: siteConfig.description,
    locale: siteConfig.locale,
    images: [{ url: "/brand/hero-goal.png", width: 1659, height: 948, alt: `${siteConfig.name} - ${siteConfig.tagline}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: headline,
    description: siteConfig.description,
    images: ["/brand/hero-goal.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: "#001938",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${brand.variable} ${script.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
