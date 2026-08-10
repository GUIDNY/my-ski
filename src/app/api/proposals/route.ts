import { createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import type { ProposalData } from "@/types";

const EMPTY_DATA: ProposalData = {
  title: "הצעת מחיר לחופשת סקי",
  subtitle: "",
  intro: "",
  sections: [],
  signature: {
    heading: "אישור ההצעה",
    text: "אני מאשר/ת כי קראתי את ההצעה, הבנתי את תנאיה ואני מסכים/ה להזמנה בהתאם למפורט לעיל.",
    fields: ["שם מלא", "תאריך", "חתימה", "מספר הזמנה"],
  },
};

export async function GET(req: NextRequest) {
  const db = createServerClient();
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const status = req.nextUrl.searchParams.get("status")?.trim();
  let query = db.from("proposals").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (q) query = query.or(`client_name.ilike.%${q}%,proposal_number.ilike.%${q}%,client_email.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const db = createServerClient();
  const body = await req.json().catch(() => ({}));
  // unique number even under concurrent writes (DB sequence)
  const { data: num } = await db.rpc("next_proposal_number");
  const row = {
    proposal_number: num as string,
    client_name: body.client_name ?? "",
    client_email: body.client_email ?? "",
    client_phone: body.client_phone ?? "",
    status: body.status ?? "draft",
    valid_until: body.valid_until ?? null,
    currency: body.currency ?? "EUR",
    data: (body.data as ProposalData) ?? EMPTY_DATA,
  };
  const { data, error } = await db.from("proposals").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
