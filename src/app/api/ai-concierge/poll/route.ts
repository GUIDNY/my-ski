import { NextRequest, NextResponse } from "next/server";
import { chatAdmin, tooManyMessages, validSession } from "@/lib/helper-chat";

/*
 * The site chat asks every few seconds whether Idan wrote to this visitor
 * from the admin chat screen (/admin/chats). Only messages after `after`.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const sessionId = sp.get("sessionId");
  if (!validSession(sessionId)) return NextResponse.json({ ok: false }, { status: 400 });
  if (tooManyMessages(`poll:${sessionId}`, 30, 60_000)) return NextResponse.json({ ok: true, messages: [] });
  const r = await chatAdmin({ action: "poll", sessionId, after: Number(sp.get("after")) || 0 });
  const messages = Array.isArray(r?.messages)
    ? (r!.messages as { id: unknown; text: unknown }[]).map(m => ({ id: Number(m.id) || 0, text: String(m.text ?? "") })).filter(m => m.id && m.text)
    : [];
  return NextResponse.json({ ok: true, messages });
}
