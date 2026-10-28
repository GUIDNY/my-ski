"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";

/*
 * Site chats: every conversation of the chat on skisharebook.com, what the
 * customer wrote and what the bot answered. Idan can write to the customer
 * from here: his message shows up in the customer's chat within a few
 * seconds, and from then on the bot stays quiet in that chat until
 * "להחזיר לבוט". (Conversations from before 28.10.2026 have only their
 * last message: the full log started then.)
 */

type Chat = { sessionId: string; name: string; lastAt: string; lastMessage: string; messages: number; quotes: number; lastTotal: number; status: string; live: boolean };
type Msg = { id: number; role: "user" | "bot" | "idan"; text: string; link: string; at: string };
type Thread = { live: boolean; status: string; lastQuote: string; messages: Msg[] };

const STATUS: Record<string, string> = { talking: "בשיחה", quoted: "קיבל הצעה", needs_idan: "צריך אותך", idan_replied: "ענית", new: "חדש" };
const time = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(+d) ? iso : d.toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function AdminChats() {
  const [chats, setChats] = useState<Chat[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    const r = await authFetch("/api/admin/chats");
    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) { setErr("לא הצלחתי לטעון את השיחות"); return; }
    setErr("");
    setChats(j.chats as Chat[]);
  }, []);

  const loadThread = useCallback(async (sid: string) => {
    const r = await authFetch(`/api/admin/chats?sessionId=${encodeURIComponent(sid)}`);
    const j = await r.json().catch(() => null);
    if (r.ok && j?.ok) setThread(j as Thread);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadList();
    const t = setInterval(loadList, 15000);
    return () => clearInterval(t);
  }, [loadList]);

  useEffect(() => {
    if (!sel) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadThread(sel);
    const t = setInterval(() => loadThread(sel), 5000);
    return () => clearInterval(t);
  }, [sel, loadThread]);

  const count = thread?.messages.length ?? 0;
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [count, sel]);

  const open = (sid: string) => { setThread(null); setSel(sid); };

  const send = async () => {
    const t = text.trim();
    if (!sel || !t || busy) return;
    setBusy(true);
    const r = await authFetch("/api/admin/chats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send", sessionId: sel, text: t }) });
    setBusy(false);
    if (!r.ok) { setErr("ההודעה לא נשלחה, נסה שוב"); return; }
    setText("");
    loadThread(sel);
    loadList();
  };

  const release = async () => {
    if (!sel || busy) return;
    setBusy(true);
    await authFetch("/api/admin/chats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "release", sessionId: sel }) });
    setBusy(false);
    loadThread(sel);
    loadList();
  };

  const cur = chats?.find(c => c.sessionId === sel);

  return (
    <div className="p-4 md:p-8 max-w-[1200px]" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-900">צ׳אט האתר</h1>
      <p className="text-sm text-gray-500 mt-1 mb-5">כל השיחות בצ׳אט באתר. כשאתה כותב ללקוח, ההודעה מופיעה אצלו בצ׳אט תוך כמה שניות, והבוט שותק בשיחה הזו עד שתחזיר אותה אליו.</p>
      {err && <p className="mb-3 text-sm font-bold text-red-600">{err}</p>}

      <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-4 md:h-[calc(100dvh-210px)]">
        {/* list */}
        <div className={`rounded-2xl border border-gray-200 bg-white overflow-y-auto ${sel ? "hidden md:block" : ""}`}>
          {chats === null ? <p className="p-4 text-sm text-gray-500">טוען…</p> : chats.length === 0 ? <p className="p-4 text-sm text-gray-500">עוד אין שיחות.</p> : chats.map(c => (
            <button key={c.sessionId} type="button" onClick={() => open(c.sessionId)}
              className={`w-full text-right p-3.5 border-b border-gray-100 hover:bg-gray-50 ${sel === c.sessionId ? "bg-blue-50" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-gray-900 truncate">{c.name || "גולש באתר"}</span>
                <span className="text-[11px] text-gray-400 shrink-0">{c.lastAt.slice(5).replace("-", ".")}</span>
              </div>
              <div className="text-[13px] text-gray-600 truncate mt-0.5">{c.lastMessage}</div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {c.live && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700">אתה בשיחה</span>}
                {c.status && <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${c.status === "needs_idan" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{STATUS[c.status] ?? c.status}</span>}
                {c.lastTotal > 0 && <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600">€{c.lastTotal.toLocaleString("en-US")}</span>}
                <span className="text-[11px] text-gray-400">{c.messages} הודעות</span>
              </div>
            </button>
          ))}
        </div>

        {/* thread */}
        <div className={`rounded-2xl border border-gray-200 bg-white flex flex-col min-h-[70dvh] md:min-h-0 ${sel ? "" : "hidden md:flex"}`}>
          {!sel ? <p className="m-auto text-sm text-gray-400">בחר שיחה</p> : (
            <>
              <div className="flex items-center gap-3 p-3.5 border-b border-gray-100">
                <button type="button" onClick={() => setSel(null)} className="md:hidden text-sm font-bold text-blue-600">→ חזרה</button>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 truncate">{cur?.name || "גולש באתר"}</div>
                  <div className="text-xs text-gray-500">{thread?.live ? "אתה עונה בשיחה הזו, הבוט שותק" : "הבוט עונה בשיחה הזו"}</div>
                </div>
                {thread?.live && <button type="button" onClick={release} disabled={busy} className="px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-gray-700 disabled:opacity-50">להחזיר לבוט</button>}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-gray-50">
                {thread === null ? <p className="text-sm text-gray-500">טוען…</p> : thread.messages.length === 0 ? (
                  <p className="text-sm text-gray-500">אין כאן היסטוריה מלאה (השיחה התחילה לפני שהתחלנו לשמור). ההודעה האחרונה: {cur?.lastMessage}</p>
                ) : thread.messages.map(m => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap
                      ${m.role === "user" ? "bg-white border border-gray-200 text-gray-900" : m.role === "idan" ? "bg-green-600 text-white" : "bg-blue-600 text-white"}`}>
                      <div className="text-[11px] opacity-70 mb-0.5">{m.role === "user" ? "לקוח" : m.role === "idan" ? "אתה" : "בוט"} · {time(m.at)}</div>
                      {m.text}
                      {m.link && <a href={m.link.replace("/api/proposals/", "/p/").replace(/\/pdf$/, "")} target="_blank" rel="noreferrer" className="block mt-1.5 underline font-bold">ההצעה שנשלחה</a>}
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              <div className="p-3 border-t border-gray-100 flex gap-2">
                <textarea value={text} onChange={e => setText(e.target.value)} rows={2} placeholder="כתוב ללקוח…"
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-[15px] focus:outline-none focus:border-blue-500" />
                <button type="button" onClick={send} disabled={busy || !text.trim()} className="px-5 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50">{busy ? "…" : "שליחה"}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
