import type { SupabaseClient } from "@supabase/supabase-js";

/*
 * lead → where it came from (sync_log job "lead_sources", the latest row; same way the
 * seller area keeps its data). Web chats: sent by the site chat. WhatsApp: read from
 * the first message ("מקור: …", the site adds it to every WhatsApp link).
 */
export type LeadSource = { src: string; landing?: string; at: string };
const JOB = "lead_sources";
const MAX = 3000;

export async function readLeadSources(db: SupabaseClient): Promise<Record<string, LeadSource>> {
  const { data } = await db.from("sync_log").select("detail").eq("job", JOB).order("id", { ascending: false }).limit(1).maybeSingle();
  const d = data?.detail;
  return d && typeof d === "object" ? d as Record<string, LeadSource> : {};
}

/** the first source of a lead wins; saved only when it is new */
export async function saveLeadSource(db: SupabaseClient, lead: string, s: { src: string; landing?: string }): Promise<void> {
  if (!lead || !s.src) return;
  try {
    const all = await readLeadSources(db);
    if (all[lead]) return;
    all[lead] = { src: String(s.src).slice(0, 80), landing: s.landing ? String(s.landing).slice(0, 120) : undefined, at: new Date().toISOString() };
    const keys = Object.keys(all);
    if (keys.length > MAX) for (const k of keys.sort((a, b) => all[a].at.localeCompare(all[b].at)).slice(0, keys.length - MAX)) delete all[k];
    const { data } = await db.from("sync_log").insert({ job: JOB, ok: true, detail: all }).select("id").single();
    if (data?.id) await db.from("sync_log").delete().eq("job", JOB).lt("id", Number(data.id) - 5);
  } catch { /* the lead works without it */ }
}
