import { NextRequest, NextResponse } from "next/server";

/**
 * Creates a PayPlus hosted payment-page link and returns its URL.
 * Secret stays server-side. Configure via env:
 *   PAYPLUS_API_KEY, PAYPLUS_SECRET_KEY, PAYPLUS_PAGE_UID,
 *   PAYPLUS_BASE_URL (default production), PAYPLUS_CURRENCY (default ILS)
 */
export async function POST(req: NextRequest) {
  const API_KEY = process.env.PAYPLUS_API_KEY;
  const SECRET = process.env.PAYPLUS_SECRET_KEY;
  const PAGE_UID = process.env.PAYPLUS_PAGE_UID;
  const BASE = process.env.PAYPLUS_BASE_URL || "https://restapi.payplus.co.il";
  const CURRENCY = process.env.PAYPLUS_CURRENCY || "ILS";

  if (!API_KEY || !SECRET) return NextResponse.json({ error: "PayPlus keys missing" }, { status: 500 });
  if (!PAGE_UID) return NextResponse.json({ error: "PAYPLUS_PAGE_UID not set" }, { status: 500 });

  const b = await req.json().catch(() => ({}));
  const amount = Number(b.amount);
  if (!amount || amount <= 0) return NextResponse.json({ error: "invalid amount" }, { status: 400 });

  const origin = req.headers.get("origin") || `https://${req.headers.get("host")}`;
  const desc = (b.description as string) || "SkiShare";

  const payload: Record<string, unknown> = {
    payment_page_uid: PAGE_UID,
    ...(process.env.PAYPLUS_TERMINAL_UID ? { terminal_uid: process.env.PAYPLUS_TERMINAL_UID } : {}),
    charge_method: 1, // 1 = charge
    amount,
    currency_code: CURRENCY,
    sendEmailApproval: true,
    sendEmailFailure: false,
    refURL_success: `${origin}/pay/success`,
    refURL_failure: `${origin}/pay/failure`,
    refURL_cancel: `${origin}/pay/failure`,
    refURL_callback: `${origin}/api/payplus/callback`,
    more_info: desc,
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
