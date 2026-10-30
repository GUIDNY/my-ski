import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { checkOverbooking } from "@/lib/overbooking";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Daily: same overbooking check; a Telegram alert to Idan when something is open.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const report = await checkOverbooking(createServerClient());
  const alert = process.env.N8N_PAY_ALERT_URL;
  if (alert && report.issues.length) {
    const lines = report.issues.map(i => `• ${i.name} (${i.code}) · ${i.apartment} · פתוח באיירבנב: ${i.openDates.join(", ")}`);
    try {
      await fetch(alert, {
        method: "POST", headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8000),
        body: JSON.stringify({
          amount: 0, currency: "ILS", name: "⚠️ בדיקת אובר-בוקינג",
          description: `תאריכים של הזמנות מהאתר שעדיין פתוחים באיירבנב — לסגור בהוסטקס:\n${lines.join("\n")}`,
          phone: "", email: "", card: "", order: "", fromLink: false,
        }),
      });
    } catch { /* report still returned */ }
  }
  return NextResponse.json(report);
}
