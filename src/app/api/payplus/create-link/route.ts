import { getEurToIls, SELL_MARKUP } from "@/lib/fx";
import { NextRequest, NextResponse } from "next/server";

/**
 * Creates a PayPlus hosted payment-page link and returns its URL.
 * Prices are in EUR across the site; when PAYPLUS_CURRENCY=ILS we convert
 * to shekels using the current EUR rate (refreshed every 12h).
 * Secret stays server-side. Env: PAYPLUS_API_KEY, PAYPLUS_SECRET_KEY,
 * PAYPLUS_PAGE_UID, PAYPLUS_BASE_URL, PAYPLUS_CURRENCY, EUR_ILS_MARKUP.
 */
export async function POST(req: NextRequest) {
  const API_KEY = process.env.PAYPLUS_API_KEY;
  const SECRET = process.env.PAYPLUS_SECRET_KEY;
  const PAGE_UID = process.env.PAYPLUS_PAGE_UID;
  const BASE = process.env.PAYPLUS_BASE_URL || "https://restapi.payplus.co.il";
  if (!API_KEY || !SECRET) return NextResponse.json({ error: "PayPlus keys missing" }, { status: 500 });
  if (!PAGE_UID) return NextResponse.json({ error: "PAYPLUS_PAGE_UID not set" }, { status: 500 });

  const b = await req.json().catch(() => ({}));
  const amountEur = Number(b.amount);
  if (!amountEur || amountEur <= 0) return NextResponse.json({ error: "invalid amount" }, { status: 400 });

  // currency chosen by the customer (falls back to env default)
  const CURRENCY = (b.currency === "EUR" || b.currency === "ILS") ? b.currency : (process.env.PAYPLUS_CURRENCY || "ILS");

  const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`;
  let desc = (b.description as string) || "SkiShare";

  // Convert EUR → ILS at the sell (cash) rate when charging in shekels
  let amount = amountEur;
  if (CURRENCY === "ILS") {
    const sell = (await getEurToIls()) * SELL_MARKUP;
    amount = Math.round(amountEur * sell); // whole shekels
    desc = `${desc} (€${amountEur} · שער ${sell.toFixed(3)})`;
  }

  const payload: Record<string, unknown> = {
    payment_page_uid: PAGE_UID,
    ...(process.env.PAYPLUS_TERMINAL_UID ? { terminal_uid: process.env.PAYPLUS_TERMINAL_UID } : {}),
    // 1 = charge now · 2 = approval/J2 (hold, captured manually later)
    charge_method: Number(process.env.PAYPLUS_CHARGE_METHOD || "1"),
    amount,
    currency_code: CURRENCY,
    sendEmailApproval: true,
    sendEmailFailure: false,
    refURL_success: `${origin}/pay/success${b.order_code ? `?order=${b.order_code}` : ""}`,
    refURL_failure: `${origin}/pay/failure`,
    refURL_cancel: `${origin}/pay/failure`,
    refURL_callback: `${origin}/api/payplus/callback`,
    more_info: desc,
    ...(b.order_code ? { more_info_1: String(b.order_code) } : {}),
    customer: {
      customer_name: b.name || undefined,
      email: b.email || undefined,
      phone: b.phone || undefined,
    },
    items: [{ name: desc, quantity: 1, price: amount }],
  };

  try {
    const res = await fetch(`${BASE}/api/v1.0/PaymentPages/generateLink`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: JSON.stringify({ api_key: API_KEY, secret_key: SECRET }),
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    const link = json?.data?.payment_page_link;
    if (json?.results?.status === "success" && link) {
      return NextResponse.json({ url: link });
    }
    return NextResponse.json({ error: json?.results?.message || "PayPlus error", raw: json }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "request failed" }, { status: 500 });
  }
}
