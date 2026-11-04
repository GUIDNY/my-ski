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
  lead: string; sessionId: string; channel: "web" | "whatsapp" | "manual"; phone: string; name: string; lastAt: string; firstAt: string;
  lastMessage: string; messages: number; quotes: number; lastTotal: number; lastQuote: string; status: string; live: boolean;
  note: string; fuStage: number; optOut: boolean; lastIdanAt: string; order: Order;
  /** seller area: whose lead (null = free, anyone can take it by answering) */
  owner?: string | null;
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

/**
 * api: /api/admin/chats (Idan) or /api/seller/chats (a seller: the same leads and
 * actions; what he writes makes the lead his). A link like ?lead=<id> opens that lead.
 */
export default function LeadsChats({ api, ordersHref, team = false, assign = false }: { api: string; ordersHref: string; team?: boolean; assign?: boolean }) {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [stage, setStage] = useState<string>("all");
  const [channel, setChannel] = useState<"all" | "web" | "whatsapp">("all");
  const [whose, setWhose] = useState<"all" | "mine" | "free">("all");
  // "+ ליד חדש": a lead added by hand (a phone call, a referral)
  const [adding, setAdding] = useState(false);
  const [nl, setNl] = useState({ name: "", phone: "", note: "", seller: "" });
  const [addErr, setAddErr] = useState("");
  // phones: an open lead takes the whole screen (like WhatsApp); its details open as a sheet
  const [info2, setInfo2] = useState(false);
  useEffect(() => {
    if (!sel || window.matchMedia("(min-width: 1024px)").matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [sel]);
  const [q, setQ] = useState("");
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loadedAt, setLoadedAt] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  // assign: Idan picks the seller of each lead here too (lib/seller-leads)
  const [owners, setOwners] = useState<{ sellers: { email: string; name: string }[]; byLead: Record<string, string | null> } | null>(null);
  const loadOwners = useCallback(async () => {
    if (!assign) return;
    const j = await authFetch("/api/seller/assign").then(r => r.json()).catch(() => null);
    if (j?.ok) setOwners({ sellers: j.sellers, byLead: Object.fromEntries((j.leads as { lead: string; owner: string | null }[]).map(l => [l.lead, l.owner])) });
  }, [assign]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOwners();
  }, [loadOwners]);
  const setOwner = async (lead: string, seller: string) => {
    await authFetch("/api/seller/assign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead, seller }) }).catch(() => null);
    setInfo(seller ? "הליד שויך" : "הליד לא משויך לאף אחד");
    loadOwners();
  };

  const loadList = useCallback(async () => {
    const r = await authFetch(api);
    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) { setErr("לא הצלחתי לטעון את הלידים"); return; }
    setErr("");
    setLeads(j.chats as Lead[]);
    setLoadedAt(Date.now());
  }, [api]);
  const loadThread = useCallback(async (lead: string) => {
    const r = await authFetch(`${api}?lead=${encodeURIComponent(lead)}`);
    const j = await r.json().catch(() => null);
    if (r.ok && j?.ok) setThread(j as Thread);
  }, [api]);

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
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current || !leads) return;
    opened.current = true;
    const want = new URLSearchParams(window.location.search).get("lead");
    const l = want ? leads.find(x => x.lead === want) : undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (l) { setThread(null); setSel(l.lead); setNote(l.note || ""); }
  }, [leads]);
  const open = (l: Lead) => { setThread(null); setSel(l.lead); setNote(l.note || ""); setInfo(""); setText(""); setInfo2(false); };

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
    (!team || whose === "all" || (whose === "mine" ? !!l.owner : !l.owner)) &&
    (!q || [l.name, l.phone, l.lastMessage, l.note, l.lastQuote].some(v => (v || "").toLowerCase().includes(q.toLowerCase()))));

  const post = async (body: Record<string, unknown>) => {
    setBusy(true);
    const r = await authFetch(api, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => null);
    setBusy(false);
    return { ok: r.ok && j?.ok, j };
  };
  const addLead = async () => {
    setAddErr("");
    const r = await authFetch("/api/seller/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nl) });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j?.ok) {
      setAddErr(j?.error === "phone" ? "צריך מספר טלפון תקין" : j?.error === "taken" ? "הלקוח הזה כבר משויך לאיש מכירות אחר" : "לא נשמר, נסה שוב");
      return;
    }
    setAdding(false); setNl({ name: "", phone: "", note: "", seller: "" });
    await loadList(); loadOwners();
    setThread(null); setSel(j.lead); setNote(nl.note); setInfo(j.existing ? "הלקוח הזה כבר קיים, פתחתי את הליד שלו" : "הליד נוסף");
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
  // seller area: take a free lead without answering it, or give one back
  const claim = async (take: boolean) => {
    if (!cur) return;
    const { ok } = await post({ action: take ? "claim" : "unclaim", lead: cur.lead });
    setInfo(ok ? (take ? "הליד עכשיו שלך" : "הליד שוחרר, הוא פנוי לכולם") : "לא הצליח, נסה שוב");
    loadList();
  };
  const release = async () => { if (!cur) return; await post({ action: "release", lead: cur.lead }); loadThread(cur.lead); loadList(); };
  const setStatus = async (status: string) => { if (!cur) return; await post({ action: "status", lead: cur.lead, status }); loadList(); };
  const saveNote = async () => { if (!cur || note === (cur.note || "")) return; await post({ action: "status", lead: cur.lead, note }); setInfo("ההערה נשמרה"); loadList(); };

  const quote = parseQuote(cur?.lastQuote || thread?.lastQuote || "");
  const curStage = cur ? stageOf(cur) : "";

  return (
    <div className="p-4 md:p-8 max-w-[1400px]" dir="rtl">
      <div className="flex items-center md:items-end justify-between gap-3 mb-4 md:mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{team ? "הלידים שלי" : "לידים וצ׳אטים"}</h1>
          <p className="hidden md:block text-sm text-gray-500 mt-1">{team ? "הלידים שלך וכל הלידים הפנויים. ליד פנוי עובר אליך ברגע שאתה עונה לו." : "כל השיחות עם הבוט, בצ׳אט באתר ובוואטסאפ, מהפנייה הראשונה ועד הסגירה."}</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={loadList} aria-label="רענון" className="w-10 h-10 md:w-auto md:h-auto flex items-center justify-center rounded-xl border border-gray-200 md:border-0 bg-white md:bg-transparent text-blue-600 text-sm font-bold hover:underline"><span className="md:hidden text-lg leading-none">↻</span><span className="hidden md:inline">רענון</span></button>
          <button type="button" onClick={() => { setAdding(v => !v); setAddErr(""); }} className="h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-sm shadow-blue-600/20 whitespace-nowrap">+ ליד חדש</button>
        </div>
      </div>
      {adding && (
        <form onSubmit={e => { e.preventDefault(); addLead(); }} className="rounded-2xl border border-blue-200 bg-blue-50 p-3 mb-4 grid grid-cols-2 md:flex md:flex-wrap gap-2 items-center">
          <input autoFocus value={nl.name} onChange={e => setNl(v => ({ ...v, name: e.target.value }))} placeholder="שם" className="col-span-1 md:flex-1 md:min-w-[130px] rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white" />
          <input value={nl.phone} onChange={e => setNl(v => ({ ...v, phone: e.target.value }))} placeholder="טלפון" dir="ltr" inputMode="tel" required className="col-span-1 md:w-[150px] rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white" />
          <input value={nl.note} onChange={e => setNl(v => ({ ...v, note: e.target.value }))} placeholder="מה הוא מחפש? (תאריכים, כמה אנשים…)" className="col-span-2 md:flex-[2] md:min-w-[200px] rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white" />
          {owners && (
            <select value={nl.seller} onChange={e => setNl(v => ({ ...v, seller: e.target.value }))} className="col-span-2 md:col-span-1 rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white font-bold">
              <option value="">לא משויך</option>
              {owners.sellers.map(x => <option key={x.email} value={x.email}>{x.name}</option>)}
            </select>
          )}
          <button className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold">הוספה</button>
          <button type="button" onClick={() => setAdding(false)} className="px-3 py-2 text-sm text-gray-600">ביטול</button>
          {addErr && <span className="text-sm font-bold text-red-600 w-full">{addErr}</span>}
        </form>
      )}
      {err && <p className="mb-3 text-sm font-bold text-red-600">{err}</p>}

      {/* ── numbers ── */}
      <div className="flex md:grid md:grid-cols-3 xl:grid-cols-6 gap-2 md:gap-3 mb-4 md:mb-5 overflow-x-auto snap-x -mx-4 px-4 md:mx-0 md:px-0 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { k: "לידים", v: String(stats.total), s: `${stats.month} ב-30 יום · ${stats.today} היום` },
          { k: "קיבלו הצעה", v: String(stats.quoted), s: stats.total ? `${Math.round((stats.quoted / stats.total) * 100)}% מהלידים` : "" },
          { k: "צריך אותך", v: String(stats.needs), s: "מחכים לתשובה ממך", warn: stats.needs > 0 },
          { k: "נסגרו", v: String(stats.won), s: stats.wonValue ? eur(stats.wonValue) : "", good: true },
          { k: "אחוז סגירה", v: `${stats.rate}%`, s: "מתוך מי שקיבל הצעה" },
          { k: "שווי הצעות פתוחות", v: eur(stats.pipeline), s: "הצעות שעוד לא נסגרו" },
        ].map(c => (
          <div key={c.k} className={`snap-start shrink-0 min-w-[124px] md:min-w-0 rounded-2xl border p-3 md:p-4 bg-white ${c.warn ? "border-red-200 bg-red-50" : c.good ? "border-emerald-200 bg-emerald-50" : "border-gray-200"}`}>
            <div className="text-xs font-bold text-gray-500">{c.k}</div>
            <div className="mt-0.5 md:mt-1 text-xl md:text-2xl font-extrabold text-gray-900 tabular-nums">{c.v}</div>
            {c.s && <div className="text-[11px] md:text-xs text-gray-500 mt-0.5 whitespace-nowrap md:whitespace-normal">{c.s}</div>}
          </div>
        ))}
      </div>

      {/* ── funnel / filters ── */}
      <div className="flex md:flex-wrap items-center gap-2 mb-2 md:mb-3 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button type="button" onClick={() => setStage("all")} className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-bold border ${stage === "all" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200"}`}>הכל · {stats.total}</button>
        {STAGES.filter(s => stats.byStage[s.key] || stage === s.key).map(s => (
          <button key={s.key} type="button" onClick={() => setStage(s.key)}
            className={`shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${stage === s.key ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200"}`}>
            <span className={`w-2 h-2 rounded-full ${s.dot}`} />{s.label} · {stats.byStage[s.key] || 0}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="חיפוש שם, טלפון, הודעה…"
          className="order-first md:order-last w-full md:w-[240px] md:mr-auto rounded-full border border-gray-200 bg-white px-4 py-2.5 md:py-2 text-[15px] md:text-sm focus:outline-none focus:border-blue-500" />
        <div className="flex items-center gap-2 max-md:w-full max-md:overflow-x-auto max-md:-mx-4 max-md:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {team && (
          <div className="shrink-0 flex gap-1 rounded-full border border-gray-200 bg-white p-0.5">
            {([["all", "הכל"], ["mine", `שלי ${(leads ?? []).filter(l => l.owner).length}`], ["free", `פנויים ${(leads ?? []).filter(l => !l.owner).length}`]] as const).map(([k, label]) => (
              <button key={k} type="button" onClick={() => setWhose(k)} className={`px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap ${whose === k ? "bg-emerald-600 text-white" : "text-gray-600"}`}>{label}</button>
            ))}
          </div>
        )}
        <div className="shrink-0 flex gap-1 rounded-full border border-gray-200 bg-white p-0.5">
          {([["all", "הכל"], ["whatsapp", `וואטסאפ ${stats.wa}`], ["web", `אתר ${stats.web}`]] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setChannel(k)} className={`px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap ${channel === k ? "bg-blue-600 text-white" : "text-gray-600"}`}>{l}</button>
          ))}
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 lg:h-[calc(100dvh-330px)] lg:min-h-[560px]">
        {/* ── list ── */}
        <div className={`rounded-2xl border border-gray-200 bg-white overflow-y-auto ${sel ? "hidden lg:block" : ""}`}>
          {leads === null ? <p className="p-4 text-sm text-gray-500">טוען…</p> : shown.length === 0 ? <p className="p-4 text-sm text-gray-500">{team && !(leads ?? []).length ? "אין כרגע לידים שלך או לידים פנויים. כשייכנס ליד חדש הוא יופיע כאן ותקבל הודעה בטלגרם." : "אין לידים כאן."}</p> : shown.map(l => {
            const st = stageInfo(stageOf(l));
            const qq = parseQuote(l.lastQuote);
            return (
              <button key={l.lead} type="button" onClick={() => open(l)}
                className={`w-full text-right px-4 py-3.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 active:bg-gray-100 ${sel === l.lead ? "bg-blue-50" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className={`shrink-0 w-2 h-2 rounded-full ${st.dot}`} />
                    <span className="font-bold text-gray-900 truncate">{l.name?.trim() || (l.channel === "web" ? "גולש באתר" : showPhone(l.phone))}</span>
                    <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${l.channel === "web" ? "bg-sky-50 text-sky-700" : l.channel === "manual" ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>{l.channel === "web" ? "אתר" : l.channel === "manual" ? "ידני" : "WhatsApp"}</span>
                  </span>
                  <span className="text-[11px] text-gray-400 shrink-0">{ago(l.lastAt)}</span>
                </div>
                <div className="text-[13px] text-gray-600 truncate mt-1">{l.lastMessage}</div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                  {qq?.people && <span className="text-[11px] text-gray-500">{qq.people} אנשים · {qq.checkin ? `${dm(qq.checkin)}–${dm(qq.checkout!)}` : ""}</span>}
                  {(l.order?.total || l.lastTotal) > 0 && <span className="text-[11px] font-bold text-gray-700">{eur(l.order?.total || l.lastTotal)}</span>}
                  {l.note && <span className="text-[11px] text-amber-700">📝</span>}
                  {team && !owners && <span className={`text-[11px] font-bold ${l.owner ? "text-indigo-700" : "text-emerald-700"}`}>{l.owner ? "👤 שלך" : "🟢 פנוי"}</span>}
                  {owners && <span className={`text-[11px] font-bold ${owners.byLead[l.lead] ? "text-indigo-700" : "text-orange-600"}`}>{owners.byLead[l.lead] ? `👤 ${owners.sellers.find(x => x.email === owners.byLead[l.lead])?.name ?? ""}` : "לא משויך"}</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── one lead ── */}
        <div className={`bg-white flex flex-col overflow-hidden lg:rounded-2xl lg:border lg:border-gray-200 lg:min-h-0 ${sel ? "max-lg:fixed max-lg:inset-0 max-lg:z-[60]" : "hidden lg:flex"}`}>
          {!cur ? <p className="m-auto text-sm text-gray-400">בחר ליד מהרשימה</p> : (
            <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[1fr_300px] relative">
              {/* conversation */}
              <div className="flex flex-col min-h-0 border-l border-gray-100">
                <div className="flex items-center gap-2 md:gap-3 px-2 md:px-3.5 py-2 md:py-3.5 border-b border-gray-100 bg-white pt-[max(env(safe-area-inset-top),8px)] lg:pt-3.5">
                  <button type="button" onClick={() => setSel(null)} aria-label="חזרה" className="lg:hidden w-10 h-10 shrink-0 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-800">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 truncate">{cur.name?.trim() || (cur.channel === "web" ? "גולש באתר" : showPhone(cur.phone))}</div>
                    <div className="text-xs text-gray-500">{cur.channel === "manual" ? "ליד שנוסף ידנית" : <>{thread?.live ? "אתה עונה בשיחה הזו, הבוט שותק" : "הבוט עונה בשיחה הזו"} · {cur.channel === "web" ? "צ׳אט באתר" : "WhatsApp"}</>}</div>
                  </div>
                  {team && !owners && !cur.owner && <button type="button" onClick={() => claim(true)} disabled={busy} className="hidden md:inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-50">📌 קח את הליד</button>}
                  {thread?.live && <button type="button" onClick={release} disabled={busy} className="hidden md:inline-flex px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-gray-700 disabled:opacity-50">להחזיר לבוט</button>}
                  {/* phones: call / WhatsApp / details right in the top bar */}
                  {cur.phone && <a href={`tel:+${cur.phone}`} aria-label="התקשרות" className="lg:hidden w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-gray-700 hover:bg-gray-100">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" /></svg>
                  </a>}
                  {cur.phone && <a href={`https://wa.me/${cur.phone}`} target="_blank" rel="noreferrer" aria-label="וואטסאפ" className="lg:hidden w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-green-600 hover:bg-green-50">
                    <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.6-1.3.1-.2 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" /></svg>
                  </a>}
                  <button type="button" onClick={() => setInfo2(v => !v)} aria-label="פרטי הליד" className={`lg:hidden xl:hidden w-10 h-10 shrink-0 flex items-center justify-center rounded-full ${info2 ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
                  </button>
                </div>
                {(thread?.live || (team && !owners && !cur.owner)) && (
                  <div className="md:hidden flex items-center justify-between gap-2 px-3 py-2 bg-emerald-50 border-b border-emerald-100 text-[13px]">
                    <span className="font-bold text-emerald-800">{thread?.live ? "אתה עונה, הבוט שותק" : "ליד פנוי"}</span>
                    {team && !owners && !cur.owner && <button type="button" onClick={() => claim(true)} disabled={busy} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold">📌 קח את הליד</button>}
                    {thread?.live && <button type="button" onClick={release} disabled={busy} className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-white text-emerald-800 font-bold">להחזיר לבוט</button>}
                  </div>
                )}
                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-2.5 bg-[#f3f1ec] lg:bg-gray-50 min-h-0 lg:min-h-[300px] overscroll-contain">
                  {thread === null ? <p className="text-sm text-gray-500">טוען…</p> : thread.messages.length === 0 ? (
                    cur.channel === "manual"
                    ? <div className="text-sm text-gray-600 space-y-1"><p>הליד נוסף ידנית ב-{cur.firstAt}. אין איתו צ׳אט במערכת: כותבים לו בוואטסאפ מהטלפון או מתקשרים (הכפתורים בצד).</p>{cur.note && <p className="text-gray-800">📝 {cur.note}</p>}<p className="text-xs text-gray-400">אם הוא יכתוב לבוט מהמספר הזה, השיחה תופיע כאן במקום הליד הידני.</p></div>
                    : <p className="text-sm text-gray-500">השיחה התחילה לפני שהתחלנו לשמור שיחות (28.10). ההודעה האחרונה: {cur.lastMessage}</p>
                  ) : thread.messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[85%] md:max-w-[82%] rounded-2xl px-3 md:px-3.5 py-2 md:py-2.5 text-[15px] md:text-[14px] leading-relaxed whitespace-pre-wrap break-words shadow-[0_1px_1px_rgba(0,0,0,0.04)]
                        ${m.role === "user" ? "bg-white border border-gray-200 text-gray-900 rounded-tr-md" : m.role === "idan" ? "bg-green-600 text-white rounded-tl-md" : "bg-blue-600 text-white rounded-tl-md"}`}>
                        <div className="text-[11px] opacity-70 mb-0.5">{m.role === "user" ? "לקוח" : m.role === "idan" ? (team ? "הצוות" : "אתה") : "בוט"} · {time(m.at)}</div>
                        {m.text}
                        {m.link && <a href={m.link.replace("/api/proposals/", "/p/").replace(/\/pdf$/, "")} target="_blank" rel="noreferrer" className="block mt-1.5 underline font-bold">ההצעה שנשלחה</a>}
                      </div>
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
                {cur.channel === "manual" ? (
                  <div className="p-3 border-t border-gray-100 text-sm text-gray-600 pb-[max(env(safe-area-inset-bottom),12px)] lg:pb-3">{info && <p className="text-xs text-gray-600 mb-1">{info}</p>}ליד ידני: עדכן סטטוס והערה בצד, וכתוב לו מהוואטסאפ שלך.</div>
                ) : (
                <div className="p-2 md:p-3 border-t border-gray-100 bg-white pb-[max(env(safe-area-inset-bottom),8px)] lg:pb-3">
                  {info && <p className="text-xs text-gray-600 mb-2 px-1">{info}</p>}
                  <div className="flex items-end gap-2">
                    <textarea value={text} onChange={e => setText(e.target.value)} rows={1} placeholder={cur.channel === "web" ? "כתוב ללקוח בצ׳אט באתר…" : "כתוב ללקוח בוואטסאפ…"}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                      className="flex-1 resize-none rounded-2xl border border-gray-300 px-3.5 py-2.5 text-[16px] md:text-[15px] max-h-32 md:min-h-[64px] focus:outline-none focus:border-blue-500" />
                    <button type="button" onClick={send} disabled={busy || !text.trim()} aria-label="שליחה" className="h-11 w-11 md:w-auto md:px-5 shrink-0 flex items-center justify-center rounded-full md:rounded-xl bg-blue-600 text-white font-bold disabled:opacity-40">
                      <span className="hidden md:inline">{busy ? "…" : "שליחה"}</span>
                      <svg className="md:hidden -scale-x-100" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" /></svg>
                    </button>
                  </div>
                  <p className="hidden md:block text-[11px] text-gray-400 mt-1.5">כשאתה כותב, הבוט שותק בשיחה עד ״להחזיר לבוט״.</p>
                </div>
                )}
              </div>

              {/* lead card */}
              {info2 && <div className="xl:hidden absolute inset-0 z-10 bg-black/30" onClick={() => setInfo2(false)} />}
              <aside className={`overflow-y-auto p-4 space-y-4 bg-white ${info2 ? "max-xl:absolute max-xl:inset-x-0 max-xl:bottom-0 max-xl:z-20 max-xl:max-h-[82%] max-xl:rounded-t-3xl max-xl:shadow-2xl max-xl:pb-[max(env(safe-area-inset-bottom),16px)]" : "max-xl:hidden"}`}>
                <div className="xl:hidden flex items-center justify-between -mt-1">
                  <span className="mx-auto w-10 h-1.5 rounded-full bg-gray-200" />
                </div>
                <div className="xl:hidden flex items-center justify-between">
                  <b className="text-gray-900">פרטי הליד</b>
                  <button type="button" onClick={() => setInfo2(false)} className="text-sm font-bold text-blue-600">סגירה</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cur.phone && <a href={`https://wa.me/${cur.phone}`} target="_blank" rel="noreferrer" className="flex-1 text-center px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-bold">וואטסאפ</a>}
                  {cur.phone && <a href={`tel:+${cur.phone}`} className="flex-1 text-center px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-gray-700">התקשרות</a>}
                </div>
                {cur.phone && <p className="text-sm text-gray-600" dir="ltr">{showPhone(cur.phone)}</p>}

                {owners && (
                  <div>
                    <div className="text-xs font-bold text-gray-400 mb-1.5">איש מכירות</div>
                    <select value={owners.byLead[cur.lead] ?? ""} onChange={e => setOwner(cur.lead, e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold bg-white">
                      <option value="">לא משויך</option>
                      {owners.sellers.map(x => <option key={x.email} value={x.email}>{x.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-gray-400 mb-1.5">סטטוס</div>
                  <div className="flex flex-wrap gap-1.5">
                    {SET_STATUS.map(s => (
                      <button key={s.key} type="button" onClick={() => setStatus(s.key)} disabled={busy}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${(curStage === s.key || (s.key === "won" && curStage === "won")) ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200"}`}>{s.label}</button>
                    ))}
                  </div>
                </div>

                {team && !owners && (
                  <div className={`rounded-xl border p-3 text-sm flex items-center justify-between gap-2 ${cur.owner ? "border-indigo-200 bg-indigo-50" : "border-emerald-200 bg-emerald-50"}`}>
                    <span className={`font-bold ${cur.owner ? "text-indigo-800" : "text-emerald-800"}`}>{cur.owner ? "👤 הליד שלך" : "🟢 ליד פנוי"}</span>
                    {cur.owner
                      ? <button type="button" onClick={() => { if (confirm("לשחרר את הליד? הוא יחזור להיות פנוי לכל אנשי המכירות.")) claim(false); }} disabled={busy} className="text-xs font-bold text-indigo-700 hover:underline">שחרור</button>
                      : <button type="button" onClick={() => claim(true)} disabled={busy} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold">📌 קח את הליד</button>}
                  </div>
                )}
                {cur.order && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
                    <div className="font-bold text-emerald-800">🎉 הזמין באתר</div>
                    <div className="text-emerald-900 mt-1">{cur.order.apartment} · {eur(cur.order.total)}</div>
                    <a href={ordersHref} className="text-xs font-bold text-emerald-700 underline">הזמנה {cur.order.code}</a>
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
