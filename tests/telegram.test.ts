import { describe, expect, it } from "vitest";
import { escapeTelegramHtml, formatDailyDigest, resolveTelegram, sendTelegramMessage } from "@/lib/messaging/telegram";

const env = (values: Record<string, string>) => values as unknown as NodeJS.ProcessEnv;

describe("resolveTelegram", () => {
  it("stays off unless both the token and the channel are set", () => {
    expect(resolveTelegram(env({}))).toBeNull();
    expect(resolveTelegram(env({ TELEGRAM_BOT_TOKEN: "123456:abcdefghijklmnopqrst" }))).toBeNull();
    expect(resolveTelegram(env({ TELEGRAM_CHAT_ID: "@winningtips" }))).toBeNull();
    expect(resolveTelegram(env({ TELEGRAM_BOT_TOKEN: "123456:abcdefghijklmnopqrst", TELEGRAM_CHAT_ID: "@winningtips" }))).toMatchObject({ chatId: "@winningtips" });
  });
});

describe("formatDailyDigest", () => {
  const base = { dateLabel: "Monday 14 September", siteUrl: "https://winning-tips.com/" };

  it("lists losses beside wins, never only the good news", () => {
    const text = formatDailyDigest({ ...base, settled: { won: 3, lost: 2, void: 1 }, freeCard: null });
    expect(text).toContain("Won 3 · Lost 2 · Void 1");
  });

  it("omits the results block on a day with nothing settled", () => {
    const text = formatDailyDigest({ ...base, settled: { won: 0, lost: 0, void: 0 }, freeCard: null });
    expect(text).not.toContain("Yesterday's results");
    expect(text).toContain("not published yet");
  });

  it("includes today's free code and escapes anything HTML-like", () => {
    const text = formatDailyDigest({ ...base, settled: { won: 0, lost: 0, void: 0 }, freeCard: { platform: "Sporty<Bet>", code: "E81TN3", games: 4 } });
    expect(text).toContain("<code>E81TN3</code>");
    expect(text).toContain("Sporty&lt;Bet&gt;");
    expect(text).toContain("4 games");
  });

  it("carries the age notice and no guarantee language", () => {
    const text = formatDailyDigest({ ...base, settled: { won: 1, lost: 0, void: 0 }, freeCard: null });
    expect(text).toContain("18+");
    expect(text).not.toMatch(/guaranteed win|sure|banker|fixed/i);
  });
});

describe("sendTelegramMessage", () => {
  const config = (body: unknown, status = 200) => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetcher = (async (url: string, init: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
    }) as unknown as typeof fetch;
    return { calls, config: { botToken: "123456:secret-token-value", chatId: "@winningtips", fetcher } };
  };

  it("posts HTML text to the configured channel", async () => {
    const { calls, config: telegram } = config({ ok: true });
    await sendTelegramMessage(telegram, "<b>Hello</b>");
    expect(calls).toHaveLength(1);
    const payload = JSON.parse(String(calls[0]!.init.body));
    expect(payload).toMatchObject({ chat_id: "@winningtips", text: "<b>Hello</b>", parse_mode: "HTML" });
  });

  it("reports Telegram's refusal without leaking the token", async () => {
    const { config: telegram } = config({ ok: false, description: "Bad Request: chat not found" }, 400);
    await expect(sendTelegramMessage(telegram, "hi")).rejects.toThrow(/chat not found/);
    await expect(sendTelegramMessage(telegram, "hi")).rejects.not.toThrow(/secret-token-value/);
  });

  it("escapes the three characters Telegram HTML requires", () => {
    expect(escapeTelegramHtml("a & <b> c")).toBe("a &amp; &lt;b&gt; c");
  });
});
