/** Accept only same-origin application paths, including after URL normalization. */
export function safeDestination(value: unknown, fallback = "/home") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return fallback;
  try {
    const url = new URL(value, "https://winning-tips.invalid");
    return url.origin === "https://winning-tips.invalid" ? url.pathname + url.search + url.hash : fallback;
  } catch { return fallback; }
}
