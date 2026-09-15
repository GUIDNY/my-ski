import { createServerClient } from "@/lib/supabase-server";
import { createQuote } from "@/lib/quotes";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const db = createServerClient();
  const b = await req.json();

  const row = {
    apartment_id:   b.apartment_id ?? null,
    apartment_name: b.apartment ?? "",
    checkin:        b.checkin || null,
    checkout:       b.checkout || null,
    guests:         Number(b.guests ?? 2),
    nights:         Number(b.nights ?? 1),
    ski_pass:       b.ski_pass === true || b.ski_pass === "true",
    transfer:       b.transfer === true || b.transfer === "true",
    equipment:      b.equipment === true || b.equipment === "true",
    cancel:         b.cancel ?? "none",
    service:        b.service ?? "human",
    apt_total:      Number(b.apt_total ?? 0),
    grand_total:    Number(b.grand_total ?? 0),
  };

  const result = await createQuote(db, row);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ id: result.id }, { status: 201 });
}
