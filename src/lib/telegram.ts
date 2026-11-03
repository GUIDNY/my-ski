import { createHash } from "node:crypto";

/*
 * Alerts to the sellers on Telegram, through a bot of their own
 * (TELEGRAM_SELLER_BOT_TOKEN, made in @BotFather). It's a separate bot from the one
 * n8n runs: n8n receives that bot's messages by webhook, and this one is read with
 * getUpdates to learn the seller's chat id when he presses Start. Server-only.
 */
const token = () => process.env.TELEGRAM_SELLER_BOT_TOKEN || "";
export const telegramConfigured = () => !!token();

async function call<T>(method: string, body?: Record<string, unknown>): Promise<T | null> {
  if (!token()) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}), signal: AbortSignal.timeout(10000), cache: "no-store",
    });
    const j = await res.json() as { ok?: boolean; result?: T };
    return j.ok ? (j.result ?? null) : null;
  } catch { return null; }
}

let botName: string | null = null;
export async function telegramBotName(): Promise<string | null> {
  if (botName) return botName;
  const me = await call<{ username?: string }>("getMe");
  botName = me?.username ?? null;
  return botName;
}

/** the code the seller sends the bot ("/start <code>"): tied to his email, nothing to store */
export function connectCode(email: string): string {
  return createHash("sha256").update(`${email.toLowerCase()}|${process.env.SUPABASE_SERVICE_ROLE_KEY || "skishare"}`).digest("hex").slice(0, 12);
}

/** the chat that sent "/start <code>" lately, or null */
export async function findStartChat(code: string): Promise<number | null> {
  const updates = await call<{ message?: { text?: string; chat?: { id?: number } } }[]>("getUpdates", { allowed_updates: ["message"] });
  for (const u of [...(updates ?? [])].reverse()) {
    const t = (u.message?.text ?? "").trim();
    if ((t === `/start ${code}` || t === code) && u.message?.chat?.id) return u.message.chat.id;
  }
  return null;
}

export async function telegramSend(chatId: number, text: string): Promise<boolean> {
  const r = await call("sendMessage", { chat_id: chatId, text: text.slice(0, 4000), disable_web_page_preview: true });
  return r !== null;
}
