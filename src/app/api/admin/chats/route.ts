import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { chatAdmin, validSession } from "@/lib/helper-chat";

/*
 * Admin chat screen (/admin/chats): the site chats, one conversation, Idan
 * writing to a visitor (the bot then stays quiet in that chat) and handing
 * it back to the bot.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const r = sessionId
    ? (validSession(sessionId) ? await chatAdmin({ action: "thread", sessionId }) : null)
    : await chatAdmin({ action: "list" });
  if (!r) return NextResponse.json({ ok: false, error: "n8n did not answer" }, { status: 502 });
  return NextResponse.json(r);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const action = b.action === "release" ? "release" : "send";
  if (!validSession(b.sessionId)) return NextResponse.json({ ok: false }, { status: 400 });
  const text = String(b.text ?? "").trim().slice(0, 2000);
  if (action === "send" && !text) return NextResponse.json({ ok: false }, { status: 400 });
  const r = await chatAdmin({ action, sessionId: b.sessionId, text });
  if (!r) return NextResponse.json({ ok: false, error: "n8n did not answer" }, { status: 502 });
  return NextResponse.json(r);
}
