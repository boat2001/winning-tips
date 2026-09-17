/** Booking platforms are stored under several spellings; show each one a single way. */
export function platformLabel(platform: string) {
  return /sporty/i.test(platform) ? "SportyBet" : platform;
}
