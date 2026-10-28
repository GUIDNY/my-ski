"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";

/*
 * Leads & chats: every conversation with the bot, on the site chat and on
 * WhatsApp, as one pipeline. A lead moves new → talking → got a quote →
 * closed (an order on the site with the same phone, or marked by hand) or lost.
 * Idan reads the whole conversation, writes to the customer from here (the
 * message goes to the site chat or to WhatsApp, and the bot stays quiet in that
 * chat until "להחזיר לבוט"), sets the status and keeps a note.
 * Conversations are saved from 28.10.2026: older ones have only their last message.
 */

type Order = { code: string; total: number; status: string; checkin: string | null; apartment: string } | null;
type Lead = {
  lead: string; sessionId: string; channel: "web" | "whatsapp"; phone: string; name: string; lastAt: string; firstAt: string;
  lastMessage: string; messages: number; quotes: number; lastTotal: number; lastQuote: string; status: string; live: boolean;
  note: string; fuStage: number; optOut: boolean; lastIdanAt: string; order: Order;
};
type Msg = { id: number; role: "user" | "bot" | "idan"; text: string; link: string; at: string };
type Thread = { live: boolean; status: string; lastQuote: string; note: string; messages: Msg[] };

const STAGES: { key: string; label: string; cls: string; dot: string }[] = [
  { key: "needs_idan", label: "צריך אותך", cls: "bg-red-100 text-red-700", dot: "bg-red-500" },
  { key: "live", label: "אתה בשיחה", cls: "bg-green-100 text-green-700", dot: "bg-green-500" },
  { key: "quoted", label: "קיבל הצעה", cls: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  { key: "talking", label: "בשיחה עם הבוט", cls: "bg-gray-100 text-gray-700", dot: "bg-gray-400" },
  { key: "idan_replied", label: "ענית", cls: "bg-violet-100 text-violet-700", dot: "bg-violet-500" },
  { key: "won", label: "נסגר 🎉", cls: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-600" },
  { key: "lost", label: "לא רלוונטי", cls: "bg-gray-100 text-gray-400", dot: "bg-gray-300" },
];
const SET_STATUS = [
  { key: "talking", label: "בשיחה" }, { key: "quoted", label: "קיבל הצעה" }, { key: "needs_idan", label: "צריך טיפול" },
  { key: "won", label: "נסגר" }, { key: "lost", label: "לא רלוונטי" },
];
const stageOf = (l: Lead) => l.order || l.status === "won" ? "won" : l.live ? "live" : l.status === "new" ? "talking" : (l.status || "talking");
const stageInfo = (k: string) => STAGES.find(s => s.key === k) ?? STAGES[3];
const eur = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;
const parseAt = (s: string) => { const t = Date.parse(s.includes("T") ? s : s.replace(" ", "T") + ":00+02:00"); return isNaN(t) ? 0 : t; };
const ago = (s: string) => {
  const t = parseAt(s); if (!t) return "";
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "עכשיו"; if (m < 60) return `לפני ${m} דק׳`;
  const h = Math.round(m / 60); if (h < 24) return `לפני ${h} שע׳`;
  const d = Math.round(h / 24); return d === 1 ? "אתמול" : `לפני ${d} ימים`;
};
const time = (iso: string) => {
  const d = new Date(iso);
  return isNaN(+d) ? "" : d.toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
};
const dm = (iso: string) => { const [, m, d] = iso.split("-"); return `${Number(d)}.${Number(m)}`; };
const showPhone = (p: string) => p.startsWith("972") ? "0" + p.slice(3).replace(/^(\d{2})(\d{3})(\d+)$/, "$1-$2-$3") : "+" + p;

/** the bot's quote summary → people, dates, apartments, price */
function parseQuote(q: string) {
  if (!q) return null;
  const people = q.match(/^(\d+) people/)?.[1];
  const dates = q.match(/(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2}) \((\d+) nights\)/);
  const apts = q.match(/apartment\(s\): (.*?); accommodation/)?.[1]?.split(" + ").map(a => a.replace(/\s*\(up to.*$/, "").trim()) ?? [];
  const total = q.match(/TOTAL €([\d,]+)/)?.[1];
  const pp = q.match(/\(€([\d,]+) per person\)/)?.[1];
  const flights = /flights €/.test(q) ? "עם טיסות" : /flights not included/.test(q) ? "בלי טיסות" : /no direct flight/.test(q) ? "אין טיסה ישירה" : "";
  return { people, checkin: dates?.[1], checkout: dates?.[2], nights: dates?.[3], apts, total, pp, flights };
}

export default function LeadsChats() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [stage, setStage] = useState<string>("all");
  const [channel, setChannel] = useState<"all" | "web" | "whatsapp">("all");
  const [q, setQ] = useState("");
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loadedAt, setLoadedAt] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    const r = await authFetch("/api/admin/chats");
    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) { setErr("לא הצלחתי לטעון את הלידים"); return; }
    setErr("");
    setLeads(j.chats as Lead[]);
    setLoadedAt(Date.now());
  }, []);
  const loadThread = useCallback(async (lead: string) => {
    const r = await authFetch(`/api/admin/chats?lead=${encodeURIComponent(lead)}`);
    const j = await r.json().catch(() => null);
    if (r.ok && j?.ok) setThread(j as Thread);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadList();
    const t = setInterval(loadList, 20000);
    return () => clearInterval(t);
  }, [loadList]);
  useEffect(() => {
    if (!sel) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadThread(sel);
    const t = setInterval(() => loadThread(sel), 6000);
    return () => clearInterval(t);
  }, [sel, loadThread]);
  const count = thread?.messages.length ?? 0;
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [count, sel]);

  const cur = leads?.find(l => l.lead === sel) ?? null;
  const open = (l: Lead) => { setThread(null); setSel(l.lead); setNote(l.note || ""); setInfo(""); setText(""); };

  // ── numbers ──
  const stats = useMemo(() => {
    const all = leads ?? [];
    const month = all.filter(l => loadedAt - parseAt(l.firstAt) < 30 * 86400_000);
    const won = all.filter(l => stageOf(l) === "won");
    const quoted = all.filter(l => l.quotes > 0);
    const open = all.filter(l => ["quoted", "needs_idan", "live", "idan_replied"].includes(stageOf(l)));
    return {
      total: all.length, month: month.length, today: all.filter(l => loadedAt - parseAt(l.firstAt) < 86400_000).length,
      quoted: quoted.length, needs: all.filter(l => stageOf(l) === "needs_idan").length,
      won: won.length, wonValue: won.reduce((s, l) => s + (l.order?.total || l.lastTotal || 0), 0),
      pipeline: open.reduce((s, l) => s + (l.lastTotal || 0), 0),
      rate: quoted.length ? Math.round((won.length / quoted.length) * 100) : 0,
      byStage: Object.fromEntries(STAGES.map(s => [s.key, all.filter(l => stageOf(l) === s.key).length])) as Record<string, number>,
      wa: all.filter(l => l.channel === "whatsapp").length, web: all.filter(l => l.channel === "web").length,
    };
  }, [leads, loadedAt]);

  const shown = (leads ?? []).filter(l =>
    (stage === "all" || stageOf(l) === stage) &&
    (channel === "all" || l.channel === channel) &&
    (!q || [l.name, l.phone, l.lastMessage, l.note, l.lastQuote].some(v => (v || "").toLowerCase().includes(q.toLowerCase()))));

  const post = async (body: Record<string, unknown>) => {
    setBusy(true);
    const r = await authFetch("/api/admin/chats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => null);
    setBusy(false);
    return { ok: r.ok && j?.ok, j };
  };
  const send = async () => {
    const t = text.trim();
    if (!cur || !t || busy) return;
    const { ok, j } = await post({ action: "send", lead: cur.lead, text: t });
    if (!ok) {
      setInfo(j?.error === "window"
        ? "וואטסאפ לא מאפשר לשלוח הודעה חופשית כשעברו 24 שעות מההודעה האחרונה של הלקוח. אפשר לשלוח לו מהטלפון שלך (כפתור וואטסאפ למעלה)."
        : "ההודעה לא נשלחה, נסה שוב");
      loadThread(cur.lead);
      return;
    }
    setText(""); setInfo(cur.channel === "web" ? "נשלח לצ׳אט באתר" : "נשלח בוואטסאפ");
    loadThread(cur.lead); loadList();
  };
  const release = async () => { if (!cur) return; await post({ action: "release", lead: cur.lead }); loadThread(cur.lead); loadList(); };
  const setStatus = async (status: string) => { if (!cur) return; await post({ action: "status", lead: cur.lead, status }); loadList(); };
  const saveNote = async () => { if (!cur || note === (cur.note || "")) return; await post({ action: "status", lead: cur.lead, note }); setInfo("ההערה נשמרה"); loadList(); };

  const quote = parseQuote(cur?.lastQuote || thread?.lastQuote || "");
  const curStage = cur ? stageOf(cur) : "";

  return (
    <div className="p-4 md:p-8 max-w-[1400px]" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">לידים וצ׳אטים</h1>
          <p className="text-sm text-gray-500 mt-1">כל השיחות עם הבוט, בצ׳אט באתר ובוואטסאפ, מהפנייה הראשונה ועד הסגירה.</p>
        </div>
        <button type="button" onClick={loadList} className="text-sm font-bold text-blue-600 hover:underline">רענון</button>
      </div>
      {err && <p className="mb-3 text-sm font-bold text-red-600">{err}</p>}

      {/* ── numbers ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        {[
          { k: "לידים", v: String(stats.total), s: `${stats.month} ב-30 יום · ${stats.today} היום` },
          { k: "קיבלו הצעה", v: String(stats.quoted), s: stats.total ? `${Math.round((stats.quoted / stats.total) * 100)}% מהלידים` : "" },
          { k: "צריך אותך", v: String(stats.needs), s: "מחכים לתשובה ממך", warn: stats.needs > 0 },
          { k: "נסגרו", v: String(stats.won), s: stats.wonValue ? eur(stats.wonValue) : "", good: true },
          { k: "אחוז סגירה", v: `${stats.rate}%`, s: "מתוך מי שקיבל הצעה" },
          { k: "שווי הצעות פתוחות", v: eur(stats.pipeline), s: "הצעות שעוד לא נסגרו" },
        ].map(c => (
          <div key={c.k} className={`rounded-2xl border p-4 bg-white ${c.warn ? "border-red-200 bg-red-50" : c.good ? "border-emerald-200 bg-emerald-50" : "border-gray-200"}`}>
            <div className="text-xs font-bold text-gray-500">{c.k}</div>
            <div className="mt-1 text-2xl font-extrabold text-gray-900 tabular-nums">{c.v}</div>
            {c.s && <div className="text-xs text-gray-500 mt-0.5">{c.s}</div>}
          </div>
        ))}
      </div>

      {/* ── funnel / filters ── */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button type="button" onClick={() => setStage("all")} className={`px-3 py-1.5 rounded-full text-sm font-bold border ${stage === "all" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200"}`}>הכל · {stats.total}</button>
        {STAGES.map(s => (
          <button key={s.key} type="button" onClick={() => setStage(s.key)} disabled={!stats.byStage[s.key] && stage !== s.key}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border disabled:opacity-40 ${stage === s.key ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200"}`}>
            <span className={`w-2 h-2 rounded-full ${s.dot}`} />{s.label} · {stats.byStage[s.key] || 0}
          </button>
        ))}
        <span className="flex-1" />
        <div className="flex gap-1 rounded-full border border-gray-200 bg-white p-0.5">
          {([["all", "הכל"], ["whatsapp", `וואטסאפ ${stats.wa}`], ["web", `אתר ${stats.web}`]] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setChannel(k)} className={`px-3 py-1 rounded-full text-sm font-bold ${channel === k ? "bg-blue-600 text-white" : "text-gray-600"}`}>{l}</button>
          ))}
        </div>
        <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="חיפוש שם, טלפון, הודעה…"
          className="w-full md:w-[240px] rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 lg:h-[calc(100dvh-330px)] lg:min-h-[560px]">
        {/* ── list ── */}
        <div className={`rounded-2xl border border-gray-200 bg-white overflow-y-auto ${sel ? "hidden lg:block" : ""}`}>
          {leads === null ? <p className="p-4 text-sm text-gray-500">טוען…</p> : shown.length === 0 ? <p className="p-4 text-sm text-gray-500">אין לידים כאן.</p> : shown.map(l => {
            const st = stageInfo(stageOf(l));
            const qq = parseQuote(l.lastQuote);
            return (
              <button key={l.lead} type="button" onClick={() => open(l)}
                className={`w-full text-right p-3.5 border-b border-gray-100 hover:bg-gray-50 ${sel === l.lead ? "bg-blue-50" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className={`shrink-0 w-2 h-2 rounded-full ${st.dot}`} />
                    <span className="font-bold text-gray-900 truncate">{l.name?.trim() || (l.channel === "web" ? "גולש באתר" : showPhone(l.phone))}</span>
                    <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${l.channel === "web" ? "bg-sky-50 text-sky-700" : "bg-green-50 text-green-700"}`}>{l.channel === "web" ? "אתר" : "WhatsApp"}</span>
                  </span>
                  <span className="text-[11px] text-gray-400 shrink-0">{ago(l.lastAt)}</span>
                </div>
                <div className="text-[13px] text-gray-600 truncate mt-1">{l.lastMessage}</div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                  {qq?.people && <span className="text-[11px] text-gray-500">{qq.people} אנשים · {qq.checkin ? `${dm(qq.checkin)}–${dm(qq.checkout!)}` : ""}</span>}
                  {(l.order?.total || l.lastTotal) > 0 && <span className="text-[11px] font-bold text-gray-700">{eur(l.order?.total || l.lastTotal)}</span>}
                  {l.note && <span className="text-[11px] text-amber-700">📝</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── one lead ── */}
        <div className={`rounded-2xl border border-gray-200 bg-white flex flex-col min-h-[75dvh] lg:min-h-0 overflow-hidden ${sel ? "" : "hidden lg:flex"}`}>
          {!cur ? <p className="m-auto text-sm text-gray-400">בחר ליד מהרשימה</p> : (
            <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_300px]">
              {/* conversation */}
              <div className="flex flex-col min-h-0 border-l border-gray-100">
                <div className="flex items-center gap-3 p-3.5 border-b border-gray-100">
                  <button type="button" onClick={() => setSel(null)} className="lg:hidden text-sm font-bold text-blue-600">→</button>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 truncate">{cur.name?.trim() || (cur.channel === "web" ? "גולש באתר" : showPhone(cur.phone))}</div>
                    <div className="text-xs text-gray-500">{thread?.live ? "אתה עונה בשיחה הזו, הבוט שותק" : "הבוט עונה בשיחה הזו"} · {cur.channel === "web" ? "צ׳אט באתר" : "WhatsApp"}</div>
                  </div>
                  {thread?.live && <button type="button" onClick={release} disabled={busy} className="px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-gray-700 disabled:opacity-50">להחזיר לבוט</button>}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-gray-50 min-h-[300px]">
                  {thread === null ? <p className="text-sm text-gray-500">טוען…</p> : thread.messages.length === 0 ? (
                    <p className="text-sm text-gray-500">השיחה התחילה לפני שהתחלנו לשמור שיחות (28.10). ההודעה האחרונה: {cur.lastMessage}</p>
                  ) : thread.messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap break-words
                        ${m.role === "user" ? "bg-white border border-gray-200 text-gray-900" : m.role === "idan" ? "bg-green-600 text-white" : "bg-blue-600 text-white"}`}>
                        <div className="text-[11px] opacity-70 mb-0.5">{m.role === "user" ? "לקוח" : m.role === "idan" ? "אתה" : "בוט"} · {time(m.at)}</div>
                        {m.text}
                        {m.link && <a href={m.link.replace("/api/proposals/", "/p/").replace(/\/pdf$/, "")} target="_blank" rel="noreferrer" className="block mt-1.5 underline font-bold">ההצעה שנשלחה</a>}
                      </div>
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
                <div className="p-3 border-t border-gray-100">
                  {info && <p className="text-xs text-gray-600 mb-2">{info}</p>}
                  <div className="flex gap-2">
                    <textarea value={text} onChange={e => setText(e.target.value)} rows={2} placeholder={cur.channel === "web" ? "כתוב ללקוח בצ׳אט באתר…" : "כתוב ללקוח בוואטסאפ…"}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                      className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-[15px] focus:outline-none focus:border-blue-500" />
                    <button type="button" onClick={send} disabled={busy || !text.trim()} className="px-5 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50">{busy ? "…" : "שליחה"}</button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">כשאתה כותב, הבוט שותק בשיחה עד ״להחזיר לבוט״.</p>
                </div>
              </div>

              {/* lead card */}
              <aside className="overflow-y-auto p-4 space-y-4 bg-white">
                <div className="flex flex-wrap gap-2">
                  {cur.phone && <a href={`https://wa.me/${cur.phone}`} target="_blank" rel="noreferrer" className="flex-1 text-center px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-bold">וואטסאפ</a>}
                  {cur.phone && <a href={`tel:+${cur.phone}`} className="flex-1 text-center px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-gray-700">התקשרות</a>}
                </div>
                {cur.phone && <p className="text-sm text-gray-600" dir="ltr">{showPhone(cur.phone)}</p>}

                <div>
                  <div className="text-xs font-bold text-gray-400 mb-1.5">סטטוס</div>
                  <div className="flex flex-wrap gap-1.5">
                    {SET_STATUS.map(s => (
                      <button key={s.key} type="button" onClick={() => setStatus(s.key)} disabled={busy}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${(curStage === s.key || (s.key === "won" && curStage === "won")) ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200"}`}>{s.label}</button>
                    ))}
                  </div>
                </div>

                {cur.order && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
                    <div className="font-bold text-emerald-800">🎉 הזמין באתר</div>
                    <div className="text-emerald-900 mt-1">{cur.order.apartment} · {eur(cur.order.total)}</div>
                    <a href="/admin/orders" className="text-xs font-bold text-emerald-700 underline">הזמנה {cur.order.code}</a>
                  </div>
                )}

                {quote && (
                  <div className="rounded-xl border border-gray-200 p-3 text-sm space-y-1">
                    <div className="font-bold text-gray-900">ההצעה האחרונה{cur.quotes > 1 ? ` (מתוך ${cur.quotes})` : ""}</div>
                    {quote.people && <div className="text-gray-700">{quote.people} אנשים{quote.checkin ? ` · ${dm(quote.checkin)}–${dm(quote.checkout!)} · ${quote.nights} לילות` : ""}</div>}
                    {quote.apts.length > 0 && <div className="text-gray-600">{quote.apts.join(" + ")}</div>}
                    {quote.flights && <div className="text-gray-500 text-xs">{quote.flights}</div>}
                    {quote.total && <div className="font-extrabold text-gray-900 text-lg">€{quote.total}{quote.pp ? <span className="text-xs font-normal text-gray-500"> · €{quote.pp} לאדם</span> : null}</div>}
                  </div>
                )}

                <div className="text-xs text-gray-500 space-y-0.5">
                  <div>פנייה ראשונה: {cur.firstAt}</div>
                  <div>הודעה אחרונה: {cur.lastAt} ({ago(cur.lastAt)})</div>
                  <div>{cur.messages} הודעות · {cur.quotes} הצעות</div>
                  {cur.channel === "whatsapp" && <div>{cur.optOut ? "ביקש לא לקבל עוד הודעות" : cur.fuStage ? `נשלחו ${cur.fuStage} תזכורות` : ""}</div>}
                  {cur.lastIdanAt && <div>ענית לאחרונה: {cur.lastIdanAt}</div>}
                </div>

                <div>
                  <div className="text-xs font-bold text-gray-400 mb-1.5">הערה שלך</div>
                  <textarea value={note} onChange={e => setNote(e.target.value)} onBlur={saveNote} rows={4} placeholder="למשל: מחכה לתשובה מהחברים, להתקשר ביום ראשון…"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
