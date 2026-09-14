/**
 * Telegram channel delivery (guide §10).
 *
 * Posts to one channel through the Bot API. Off unless both the bot token and
 * the channel are configured, so a deployment without them skips delivery
 * rather than failing the night's automation.
 *
 * Two rules from the guide shape the digest: losses are never hidden, and
 * there is no urgency language. The message states what settled, what is
 * published today, and where to read it.
 *
 * The token lives in the request URL, which is how the Bot API works, so it is
 * never echoed into a thrown message or a log line.
 */

export type Fetcher = typeof fetch;

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  fetcher?: Fetcher;
  timeoutMs?: number;
}

export function resolveTelegram(env: NodeJS.ProcessEnv = process.env): TelegramConfig | null {
  const botToken = env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = env.TELEGRAM_CHAT_ID?.trim();
  return botToken && chatId ? { botToken, chatId } : null;
}

/** Telegram's HTML mode needs only these three escaped. */
export function escapeTelegramHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendTelegramMessage(config: TelegramConfig, text: string): Promise<void> {
  const fetcher = config.fetcher ?? fetch;
  let response: Response;
  try {
    response = await fetcher(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: config.chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
      cache: "no-store",
      signal: AbortSignal.timeout(config.timeoutMs ?? 15_000),
    });
  } catch {
    throw new Error("Telegram could not be reached.");
  }

  const body = (await response.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
  if (!response.ok || !body?.ok) {
    // The description is Telegram's own text ("chat not found"); it never contains the token.
    throw new Error(`Telegram rejected the message${body?.description ? `: ${body.description}` : "."}`);
  }
}

export interface DailyDigestInput {
  /** Human date for the heading, e.g. "Monday 14 September". */
  dateLabel: string;
  settled: { won: number; lost: number; void: number };
  freeCard: { platform: string; code: string; games: number } | null;
  siteUrl: string;
}

export function formatDailyDigest(input: DailyDigestInput): string {
  const lines = [`<b>Winning Tips · ${escapeTelegramHtml(input.dateLabel)}</b>`, ""];

  const graded = input.settled.won + input.settled.lost + input.settled.void;
  if (graded > 0) {
    // Every outcome is listed, losses included, whatever the night looked like.
    lines.push(`<b>Yesterday's results</b>`, `Won ${input.settled.won} · Lost ${input.settled.lost} · Void ${input.settled.void}`, "");
  }

  if (input.freeCard) {
    const games = input.freeCard.games === 1 ? "1 game" : `${input.freeCard.games} games`;
    lines.push(
      `<b>Today's free card</b>`,
      `${escapeTelegramHtml(input.freeCard.platform)} code: <code>${escapeTelegramHtml(input.freeCard.code)}</code> (${games})`,
      "",
    );
  } else {
    lines.push("Today's free card is not published yet.", "");
  }

  lines.push(`Full record and analysis: ${escapeTelegramHtml(input.siteUrl)}`, "18+ · No prediction is guaranteed.");
  return lines.join("\n");
}
