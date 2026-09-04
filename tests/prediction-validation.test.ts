import { describe, expect, it } from "vitest";
import { deckInputSchema, predictionInputSchema } from "@/lib/predictions/validation";

describe("prediction validation", () => {
  const validPrediction = {
    fixtureId: "fixture-1",
    deckId: "deck-1",
    market: "Total Goals",
    selection: "Over 1.5 Goals",
    odds: "1.42",
    confidence: "78",
    analysis: "The attacking profile supports at least two goals in this fixture.",
    visibility: "FREE",
    status: "PUBLISHED",
    result: "PENDING",
  };

  it("accepts a complete prediction and coerces numeric values", () => {
    const parsed = predictionInputSchema.parse(validPrediction);
    expect(parsed.odds).toBe(1.42);
    expect(parsed.confidence).toBe(78);
  });

  it("rejects impossible confidence and thin analysis", () => {
    expect(() => predictionInputSchema.parse({ ...validPrediction, confidence: 120 })).toThrow();
    expect(() => predictionInputSchema.parse({ ...validPrediction, analysis: "Because." })).toThrow();
  });

  it("validates Deck pricing and duration", () => {
    const deck = deckInputSchema.parse({ name: "VIP Deck", description: "Premium daily sports selections.", isPremium: true, sortOrder: "2" });
    expect(deck.isPremium).toBe(true);
    expect(deck.sortOrder).toBe(2);
  });
});
