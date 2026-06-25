// Seeds the default seasonal pricing calendar into every existing apartment.
// Idempotent: removes prior "עונתי (ברירת מחדל)" rules first, then re-inserts.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n").filter(l => l.includes("=")).map(l => {
    const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
  })
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const PERIODS = [
  ["2026-12-01","2026-12-11",80,120],["2026-12-12","2026-12-18",105,155],
  ["2026-12-19","2026-12-25",290,430],["2026-12-26","2027-01-01",480,725],
  ["2027-01-02","2027-01-08",210,315],["2027-01-09","2027-01-15",185,275],
  ["2027-01-16","2027-01-22",165,250],["2027-01-23","2027-01-29",165,250],
  ["2027-01-30","2027-02-05",190,295],["2027-02-06","2027-02-12",225,345],
  ["2027-02-13","2027-02-19",260,400],["2027-02-20","2027-02-26",280,420],
  ["2027-02-27","2027-03-05",245,370],["2027-03-06","2027-03-12",200,305],
  ["2027-03-13","2027-03-19",190,295],["2027-03-20","2027-03-26",175,260],
  ["2027-03-27","2027-04-02",200,305],["2027-04-03","2027-04-09",175,260],
  ["2027-04-10","2027-04-16",130,200],["2027-04-17","2027-04-23",105,155],
  ["2027-04-24","2027-04-30",80,120],
];
const LABEL = "עונתי (ברירת מחדל)";
const rulesFor = id => PERIODS.flatMap(([s,e,wd,we]) => ([
  { apartment_id:id, label:`${LABEL} · א׳-ה׳`, type:"date_range", price_type:"absolute", start_date:s, end_date:e, weekdays:[0,1,2,3,4], price:wd, priority:10 },
  { apartment_id:id, label:`${LABEL} · ו׳-ש׳`, type:"date_range", price_type:"absolute", start_date:s, end_date:e, weekdays:[5,6], price:we, priority:10 },
]));

const { data: apts } = await db.from("apartments").select("id,name");
for (const a of apts) {
  await db.from("pricing_rules").delete().eq("apartment_id", a.id).like("label", `${LABEL}%`);
  const { error } = await db.from("pricing_rules").insert(rulesFor(a.id));
  console.log(error ? `✗ ${a.name}: ${error.message}` : `✓ ${a.name}: seeded ${rulesFor(a.id).length} rules`);
}
console.log("done");
