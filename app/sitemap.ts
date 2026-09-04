import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/config/site";
import { getPublishedPredictionSitemapRows } from "@/lib/predictions/queries";

const staticRoutes = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/predictions", priority: 0.9, changeFrequency: "daily" },
  { path: "/vip", priority: 0.8, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/help", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/responsible-betting", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  let predictions: Awaited<ReturnType<typeof getPublishedPredictionSitemapRows>> = [];

  try {
    predictions = await getPublishedPredictionSitemapRows();
  } catch {
    // Keep the static sitemap available if the database is temporarily unavailable.
  }

  return [
    ...staticRoutes.map(({ path, priority, changeFrequency }) => ({
      url: new URL(path, siteUrl).toString(),
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...predictions.map((prediction) => ({
      url: new URL(`/predictions/${prediction.slug}`, siteUrl).toString(),
      lastModified: prediction.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
