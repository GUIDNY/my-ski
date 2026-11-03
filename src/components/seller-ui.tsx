"use client";
// Small shared pieces of the seller area screens.

export const eur = (n: number | null | undefined) => n == null ? "—" : `€${Math.round(n).toLocaleString("en-US")}`;
export const dmy = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? iso + "T12:00:00" : iso);
  return isNaN(+d) ? "" : d.toLocaleDateString("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", year: "2-digit" });
};
export const showPhone = (p: string) => !p ? "" : p.startsWith("972") ? "0" + p.slice(3).replace(/^(\d{2})(\d{3})(\d+)$/, "$1-$2-$3") : "+" + p;

export const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  approved: { label: "שולם", cls: "bg-emerald-100 text-emerald-800" },
  hold: { label: "פיקדון", cls: "bg-amber-100 text-amber-800" },
  awaiting: { label: "לא שילם", cls: "bg-orange-100 text-orange-700" },
  cancelled: { label: "בוטל", cls: "bg-gray-100 text-gray-500" },
};

export function Stat({ k, v, s, tone }: { k: string; v: string; s?: string; tone?: "good" | "warn" | "gold" }) {
  const cls = tone === "good" ? "border-emerald-200 bg-emerald-50" : tone === "warn" ? "border-orange-200 bg-orange-50" : tone === "gold" ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-white";
  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <div className="text-xs font-bold text-gray-500">{k}</div>
      <div className="mt-1 text-2xl font-extrabold text-gray-900 tabular-nums">{v}</div>
      {s && <div className="text-xs text-gray-500 mt-0.5">{s}</div>}
    </div>
  );
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
