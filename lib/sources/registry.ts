/**
 * Where published slips are collected from.
 *
 * A source is only ever a place that publishes booking codes we are entitled to
 * use. Codes are loaded through the bookmaker's own API afterwards, so what a
 * source supplies is a pointer, never someone else's prose or analysis.
 *
 * Adding a source is a legal decision before it is a technical one: it needs
 * either our ownership of the site or written permission covering resale.
 */
export interface TipSource {
  readonly id: string;
  readonly name: string;
  /** Public page whose HTML carries the codes. */
  readonly url: string;
  /** Bookmaker the codes belong to; only SportyBet can be loaded today. */
  readonly platform: "SportyBet";
  readonly enabled: boolean;
  /** Why it is on or off, shown in the admin panel beside the source. */
  readonly note: string;
}

export const tipSources: readonly TipSource[] = [
  {
    id: "tips-deck",
    name: "Tips Deck",
    url: "https://www.tips-deck.com/predictions",
    platform: "SportyBet",
    enabled: true,
    note: "Our own site. Its free card's booking code is published in the page itself.",
  },
  {
    id: "a1-tips",
    name: "A1 Tips",
    platform: "SportyBet",
    url: "https://a1-tips.com/predictions",
    enabled: false,
    // Their tips sit behind a login, so collecting them means using an account
    // and reselling what is inside it. That needs permission naming resale, in
    // writing, from them — not merely access to the page.
    note: "Off until written permission covering resale is on file. Their published pages show no codes; the tips are behind a login.",
  },
] as const;

export function enabledSources(): readonly TipSource[] {
  return tipSources.filter((source) => source.enabled);
}

export function sourceById(id: string): TipSource | undefined {
  return tipSources.find((source) => source.id === id);
}
