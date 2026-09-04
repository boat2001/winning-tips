import { z } from "zod";

export const predictionInputSchema = z.object({
  fixtureId: z.string().min(1),
  deckId: z.string().optional().transform((value) => value || null),
  market: z.string().trim().min(2).max(80),
  selection: z.string().trim().min(1).max(120),
  odds: z.coerce.number().positive().max(9999),
  confidence: z.coerce.number().int().min(1).max(100),
  analysis: z.string().trim().min(20).max(5000),
  visibility: z.enum(["FREE", "PREMIUM"]),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]),
  result: z.enum(["PENDING", "WON", "LOST", "VOID", "PUSH", "CANCELLED"]),
});

export const deckInputSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().min(10).max(500),
  icon: z.string().trim().max(12).optional(),
  visualIdentifier: z.string().trim().max(30).optional(),
  isPremium: z.coerce.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(1000),
});
