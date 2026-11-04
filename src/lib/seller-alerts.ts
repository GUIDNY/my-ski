import type { SupabaseClient } from "@supabase/supabase-js";
import { chatAdmin } from "@/lib/helper-chat";
import { SELLERS, phoneDigits } from "@/lib/sellers";
import { readSellerConfig, sellerData } from "@/lib/seller-store";
import { leadOwner } from "@/lib/seller-leads";
import { apartmentsForProfit, profitFromData } from "@/lib/proposal-profit";
import { telegramSend } from "@/lib/telegram";
import { SITE } from "@/lib/site";

/*
 * The seller alerts, run every few minutes by /api/cron/seller-alerts: compares the
 * leads in n8n with the last check, and tells the lead's seller (lib/seller-leads:
 * assigned, written to, or auto-assigned) on Telegram about a new conversation
 * (WhatsApp or the site chat) and about a quote that was just sent, with its profit
 * and his share. A lead nobody owns yet goes to every seller (first one to answer takes it). The last check is the latest sync_log row with
 * job='seller_alerts'; the first run only learns what exists.
 */
const JOB = "seller_alerts";
const MAX_ALERTS = 12;

type Lead = { lead: string; channel: string; phone: string; name: string; firstAt?: string; lastMessage: string; quotes: number; lastQuote: string; lastTotal: number };

const eur = (n: number) => `€${Math.round(n).toLocaleString("en-US")}`;
const showPhone = (p: string) => p.startsWith("972") ? "0" + p.slice(3).replace(/^(\d{2})(\d{3})(\d+)$/, "$1-$2-$3") : p ? "+" + p : "";
const dm = (iso: string) => { const [, m, d] = iso.split("-"); return `${Number(d)}.${Number(m)}`; };

function quoteSummary(q: string, total: number): string {
  const people = q.match(/^(\d+) people/)?.[1];
  const dates = q.match(/(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})/);
  const sum = q.match(/TOTAL €([\d,]+)/)?.[1];
  return [people ? `${people} אנשים` : "", dates ? `${dm(dates[1])}–${dm(dates[2])}` : "", sum ? `€${sum}` : total ? eur(total) : ""].filter(Boolean).join(" · ");
}

export async function checkSellerAlerts(db: SupabaseClient): Promise<Record<string, unknown>> {
  const list = await chatAdmin({ action: "list" });
  if (!list) return { ok: false, error: "n8n did not answer" };
  const leads = ((list.chats as Lead[]) || []).filter(l => l && l.lead);

  const { data: last } = await db.from("sync_log").select("detail").eq("job", JOB).order("id", { ascending: false }).limit(1).maybeSingle();
  const prev = (last?.detail as { leads?: Record<string, number> } | null)?.leads ?? null;
  const now: Record<string, number> = Object.fromEntries(leads.map(l => [l.lead, Number(l.quotes) || 0]));

  // the first run only learns what exists today, so nobody gets a flood of old leads
  if (!prev) {
    await db.from("sync_log").insert({ job: JOB, ok: true, detail: { leads: now, first: true } });
    return { ok: true, first: true, leads: leads.length };
  }

  const fresh = leads.filter(l => prev[l.lead] === undefined);
  const quoted = leads.filter(l => prev[l.lead] !== undefined && (Number(l.quotes) || 0) > prev[l.lead]);
  // a new lead that already got a quote gets one message, not two
  const quotedAll = [...quoted, ...fresh.filter(l => (Number(l.quotes) || 0) > 0)];

  const cfg = await readSellerConfig(db);
  const to = SELLERS.map(s => ({ seller: s, chat: sellerData(cfg, s.email).telegram })).filter((x): x is { seller: typeof SELLERS[number]; chat: number } => !!x.chat);

  // the proposals made in the last hours, to show the profit behind a quote that was just sent
  let recent: { phone: string; id: string; data: unknown }[] = [];
  let apts: { name: string | null; source: string | null }[] = [];
  if (quotedAll.length && to.length) {
    const since = new Date(Date.now() - 6 * 3600_000).toISOString();
    const [{ data }, a] = await Promise.all([
      db.from("proposals").select("id, client_phone, data, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(60),
      apartmentsForProfit(db),
    ]);
    recent = (data ?? []).map(p => ({ phone: phoneDigits(p.client_phone), id: p.id, data: p.data }));
    apts = a;
  }

  // each alert: its lines, the profit behind it when it's a quote (the share is per seller), and a link
  type Alert = { lines: string[]; profit: number | null; link: string; owner: string | null };
  const alerts: Alert[] = [];
  const whoOf = (l: Lead) => [l.name?.trim(), showPhone(l.phone)].filter(Boolean).join(" · ") || "גולש באתר";
  const chatLink = (l: Lead) => `${SITE}/seller/chats?lead=${encodeURIComponent(l.lead)}`;
  for (const l of fresh.filter(x => !quotedAll.includes(x))) {
    alerts.push({
      lines: [`💬 ליד חדש ${l.channel === "web" ? "בצ׳אט באתר" : "בוואטסאפ"}`, whoOf(l), ...(l.lastMessage ? [`"${l.lastMessage.slice(0, 200)}"`] : [])],
      profit: null, link: chatLink(l), owner: leadOwner(cfg, l).seller,
    });
  }
  for (const l of quotedAll) {
    const p = l.phone ? recent.find(r => r.phone && r.phone === phoneDigits(l.phone)) : undefined;
    const pr = p ? profitFromData(p.data, apts) : null;
    alerts.push({
      lines: [`📄 נשלחה הצעת מחיר${prev[l.lead] === undefined ? " (ליד חדש)" : ""}`, whoOf(l), quoteSummary(l.lastQuote || "", Number(l.lastTotal) || 0)].filter(Boolean),
      profit: pr && pr.lines.length ? pr.totalProfit : null,
      link: p ? `${SITE}/p/${p.id}` : chatLink(l), owner: leadOwner(cfg, l).seller,
    });
  }

  let sent = 0;
  for (const { seller, chat } of to) {
    const mine = alerts.filter(a => a.owner === seller.email || !a.owner);
    for (const a of mine.slice(0, MAX_ALERTS)) {
      const money = a.profit != null ? [`רווח משוער ${eur(a.profit)} · החלק שלך ${eur(a.profit * seller.share)}`] : [];
      const free = !a.owner ? ["🟢 פנוי: מי שעונה ראשון מקבל אותו"] : [];
      if (await telegramSend(chat, [...a.lines, ...free, ...money, a.link].join("\n"))) sent++;
    }
    if (mine.length > MAX_ALERTS) await telegramSend(chat, `ועוד ${mine.length - MAX_ALERTS} עדכונים: ${SITE}/seller/chats`);
  }

  if (fresh.length || quoted.length) {
    const { data: row } = await db.from("sync_log").insert({ job: JOB, ok: true, detail: { leads: now, newLeads: fresh.length, quotes: quotedAll.length, sent } }).select("id").single();
    if (row?.id) await db.from("sync_log").delete().eq("job", JOB).lt("id", Number(row.id) - 5);
  }
  return { ok: true, newLeads: fresh.length, quotes: quotedAll.length, sellers: to.length, sent };
}
