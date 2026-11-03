import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { telegramConfigured } from "@/lib/telegram";
import { checkSellerAlerts } from "@/lib/seller-alerts";

/*
 * Every few minutes (GitHub Actions: .github/workflows/seller-alerts.yml, Vercel's
 * Hobby crons run only once a day): Telegram alerts to the sellers about new leads
 * and quotes that were just sent (lib/seller-alerts.ts). No secret needed: it only
 * ever sends what is new, and runs at most once a minute.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

let lastRun = 0;

export async function GET() {
  if (Date.now() - lastRun < 60_000) return NextResponse.json({ ok: true, skipped: "too soon" });
  lastRun = Date.now();
  if (!telegramConfigured()) return NextResponse.json({ ok: false, error: "TELEGRAM_SELLER_BOT_TOKEN missing" });
  const r = await checkSellerAlerts(createServerClient());
  return NextResponse.json(r, { status: r.ok ? 200 : 502 });
}
