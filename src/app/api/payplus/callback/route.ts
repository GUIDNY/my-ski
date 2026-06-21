import { NextRequest, NextResponse } from "next/server";

// PayPlus server-to-server callback (IPN). For now we just acknowledge 200 OK.
// TODO: verify the hash + record the paid booking once a bookings flow is wired.
export async function POST(req: NextRequest) {
  try { await req.json().catch(() => null); } catch {}
  return NextResponse.json({ ok: true });
}
