"use client";
import { useEffect, useState } from "react";
import type { Order, Apartment } from "@/types";
import { authFetch } from "@/lib/auth-fetch";
import { AIRLINES, cleanFlight, airlineByFlightNo, BLOCK_MIN } from "@/lib/flight-checkin";
import { PAY_METHODS } from "@/lib/morning";

const STATUS: Record<string, { label: string; cls: string }> = {
  awaiting:  { label: "🔥 ליד חם — הגיע לתשלום, לא שילם", cls: "bg-orange-100 text-orange-700" },
  hold:      { label: "פיקדון — ממתין לאישור", cls: "bg-amber-100 text-amber-700" },
  approved:  { label: "אושר ✓", cls: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "בוטל", cls: "bg-red-100 text-red-600" },
};

const fmt = (s: string | null) => (s ? new Date(s + "T12:00:00").toLocaleDateString("he-IL", { day: "numeric", month: "short" }) : "—");

const CANCEL_LABEL: Record<string, string> = { regular: "ביטול רגיל", none: "ללא ביטול", flexible: "ביטול גמיש" };

const EMPTY_NEW_ORDER = {
  apartment_id: "", extra_apartment_id: "", checkin: "", checkout: "", guests: 2, total_eur: 0,
  customer_name: "", customer_email: "", customer_phone: "", status: "approved" as "approved" | "hold",
  ski_pass: false, transfer: false, equipment: false, transfer_details: "",
  pass3v: false, flight: false, flight_details: "", flight_price: 0,
  stay_address: "", stay_ref: "", stay_notes: "",
  fl_airline: "", fl_pnr: "", fl_url: "", fl_out_date: "", fl_out_time: "", fl_out_no: "", fl_ret_date: "", fl_ret_time: "", fl_ret_no: "",
  fl_out_arr: "", fl_out_airport: "", fl_ret_airport: "",
};

const hhmm = (ms: number, tz: string) => new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(ms));
const ymdIn = (ms: number, tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));

/** a flight number + date → the real times (the transfer company's flight data, direct flights Tel Aviv ⇄ Geneva/Lyon) */
async function lookupLeg(no: string, date: string, leg: "out" | "ret") {
  for (const ap of ["GVA", "LYS"]) {
    const q = new URLSearchParams({ flight_no: no, date, airport_code: ap, direction: leg === "out" ? "arrival" : "departure", full: "1" });
    const j = await fetch(`/api/transfers/flight?${q}`).then(r => r.json()).catch(() => null);
    const t = j?.found && typeof j.flight?.time === "string" ? Date.parse(j.flight.time) : NaN;
    if (!isNaN(t)) {
      if (leg === "ret") return { airport: ap, date: ymdIn(t, "Europe/Paris"), time: hhmm(t, "Europe/Paris") };
      const dep = t - (BLOCK_MIN[ap] ?? 285) * 60_000;
      return { airport: ap, arr: hhmm(t, "Europe/Paris"), date: ymdIn(dep, "Asia/Jerusalem"), time: hhmm(dep, "Asia/Jerusalem") };
    }
  }
  return null;
}

// Searchable apartment picker with a regular/agency (La Cime) toggle — the
// full list is ~90 apartments (6 regular + ~83 synced from La Cime), too
// long for a plain <select> to browse comfortably.
function ApartmentPicker({ apartments, value, onChange, label, excludeId }: {
  apartments: Apartment[]; value: string; onChange: (id: string) => void; label: string; excludeId?: string;
}) {
  const [group, setGroup] = useState<"regular" | "la_cime">("regular");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = apartments.find(a => a.id === value);
  const pool = apartments.filter(a => (a.source === "la_cime") === (group === "la_cime") && a.id !== excludeId);
  const filtered = query.trim() ? pool.filter(a => a.name.toLowerCase().includes(query.trim().toLowerCase())) : pool;

  return (
    <div className="relative">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">{label}</label>
      <div className="flex gap-1.5 mb-1.5">
        <button type="button" onClick={() => setGroup("regular")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${group === "regular" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500"}`}>רגיל</button>
        <button type="button" onClick={() => setGroup("la_cime")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${group === "la_cime" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500"}`}>סוכנות (La Cime)</button>
      </div>
      <input
        value={open ? query : (selected?.name ?? "")}
        onFocus={() => setOpen(true)}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="הקלד לחיפוש דירה…"
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">
          {filtered.length === 0 && <div className="px-4 py-2.5 text-sm text-gray-400">אין תוצאות</div>}
          {filtered.map(a => (
            <button key={a.id} type="button" onMouseDown={() => { onChange(a.id); setQuery(""); setOpen(false); }}
              className="w-full text-right px-4 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0">
              {a.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newOrder, setNewOrder] = useState(EMPTY_NEW_ORDER);
  const [addBusy, setAddBusy] = useState(false);
  const [showExtraApt, setShowExtraApt] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const closeForm = () => {
    setShowAdd(false);
    setEditingOrder(null);
    setNewOrder(EMPTY_NEW_ORDER);
    setShowExtraApt(false);
  };

  const [flMsg, setFlMsg] = useState("");
  // Idan types only the flight numbers: the airline, the airport and the times come from the flight data
  const fillFlights = async () => {
    setFlMsg("בודק…");
    const outNo = newOrder.fl_out_no.trim(), retNo = newOrder.fl_ret_no.trim();
    const [o, r] = await Promise.all([
      outNo && (newOrder.fl_out_date || newOrder.checkin) ? lookupLeg(outNo, newOrder.fl_out_date || newOrder.checkin, "out") : Promise.resolve(null),
      retNo && (newOrder.fl_ret_date || newOrder.checkout) ? lookupLeg(retNo, newOrder.fl_ret_date || newOrder.checkout, "ret") : Promise.resolve(null),
    ]);
    setNewOrder(v => ({
      ...v,
      fl_airline: v.fl_airline || airlineByFlightNo(outNo || retNo),
      ...(o ? { fl_out_date: o.date, fl_out_time: o.time, fl_out_arr: o.arr ?? "", fl_out_airport: o.airport } : {}),
      ...(r ? { fl_ret_date: r.date, fl_ret_time: r.time, fl_ret_airport: r.airport } : {}),
    }));
    const miss = [outNo && !o && `הלוך ${outNo}`, retNo && !r && `חזור ${retNo}`].filter(Boolean);
    setFlMsg(miss.length ? `לא מצאתי את ${miss.join(" ו-")} בתאריך הזה: אפשר למלא שעה ידנית` : "✓ מולא לפי מספרי הטיסה");
  };

  const startEdit = (o: Order) => {
    setEditingOrder(o);
    setNewOrder({
      apartment_id: o.apartment_id || "", extra_apartment_id: o.extra_apartment_id || "",
      checkin: o.checkin || "", checkout: o.checkout || "", guests: o.guests, total_eur: Number(o.total_eur) || 0,
      customer_name: o.customer_name || "", customer_email: o.customer_email || "", customer_phone: o.customer_phone || "",
      status: (o.status === "hold" ? "hold" : "approved"),
      ski_pass: !!o.ski_pass, transfer: !!o.transfer, equipment: !!o.equipment, transfer_details: o.transfer_details || "",
      pass3v: !!(o.ops && o.ops.x_pass3v), flight: !!o.flight, flight_details: o.flight_details || "", flight_price: Number(o.flight_price) || 0,
      ...(() => { const st = (o.ops && typeof o.ops.x_stay === "object" && o.ops.x_stay ? o.ops.x_stay : {}) as Record<string, string>;
        return { stay_address: st.address || "", stay_ref: st.ref || "", stay_notes: st.notes || "" }; })(),
      ...(() => { const fl = cleanFlight(o.ops && o.ops.x_flight);
        return { fl_airline: fl?.airline || "", fl_pnr: fl?.pnr || "", fl_url: fl?.url || "",
          fl_out_date: fl?.out.date || o.checkin || "", fl_out_time: fl?.out.time || "", fl_out_no: fl?.out.no || "",
          fl_ret_date: fl?.ret.date || o.checkout || "", fl_ret_time: fl?.ret.time || "", fl_ret_no: fl?.ret.no || "",
          fl_out_arr: fl?.out.arr || "", fl_out_airport: fl?.out.airport || "", fl_ret_airport: fl?.ret.airport || "" }; })(),
    });
    setShowExtraApt(!!o.extra_apartment_id);
    setShowAdd(true);
  };

  // ── the toolbar: search, status, upcoming/past, sort ──
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [range, setRange] = useState<"upcoming" | "past" | "all">("upcoming");
  const [sort, setSort] = useState<"checkin" | "new">("checkin");
  const [today, setToday] = useState("");

  const load = async () => {
    setLoading(true);
    const r = await authFetch("/api/orders");
    setOrders(await r.json());
    setToday(new Date().toISOString().slice(0, 10));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { authFetch("/api/apartments?all=1").then(r => r.json()).then(setApartments).catch(() => {}); }, []);

  // Manually add a real booking (e.g. taken by phone) — this is the only
  // way an admin-created order actually blocks its dates: POST /api/orders
  // never sets a status (so it defaults to "awaiting", which doesn't block
  // anything — see PATCH /api/orders/[id]), so we immediately follow up
  // with a status PATCH, same as approving/holding any other order.
  const submitOrder = async () => {
    const apt = apartments.find(a => a.id === newOrder.apartment_id);
    if (!apt) { alert("בחר/י דירה"); return; }
    if (!newOrder.checkin || !newOrder.checkout) { alert("בחר/י תאריכי הגעה ועזיבה"); return; }
    if (newOrder.checkout <= newOrder.checkin) { alert("תאריך העזיבה חייב להיות אחרי תאריך ההגעה"); return; }
    if (!newOrder.customer_name.trim()) { alert("הזן/י שם לקוח"); return; }
    const extraApt = newOrder.extra_apartment_id ? apartments.find(a => a.id === newOrder.extra_apartment_id) : null;
    const nights = Math.round((+new Date(newOrder.checkout) - +new Date(newOrder.checkin)) / 86400000);
    const fields = {
      apartment_id: apt.id, apartment_name: apt.name,
      extra_apartment_id: extraApt?.id || null, extra_apartment_name: extraApt?.name || null,
      checkin: newOrder.checkin, checkout: newOrder.checkout, guests: newOrder.guests, nights,
      total_eur: newOrder.total_eur,
      ski_pass: newOrder.ski_pass, transfer: newOrder.transfer, equipment: newOrder.equipment,
      transfer_details: newOrder.transfer ? newOrder.transfer_details : "",
      flight: newOrder.flight, flight_details: newOrder.flight ? newOrder.flight_details : null,
      flight_price: newOrder.flight && newOrder.flight_price > 0 ? newOrder.flight_price : null,
      // the ski pass area is kept in ops (x_ keys are not checklist items): the personal area shows it
      ops: { ...((editingOrder && editingOrder.ops) || {}), x_pass3v: newOrder.ski_pass && newOrder.pass3v,
        // arrival details for the guest: shown in the personal area after the online check-in
        x_stay: { address: newOrder.stay_address.trim(), ref: newOrder.stay_ref.trim(), notes: newOrder.stay_notes.trim() },
        // flight check-in in the personal area + the email 24 hours before (reminders already sent are kept)
        x_flight: newOrder.flight ? {
          ...(cleanFlight(editingOrder && editingOrder.ops && editingOrder.ops.x_flight) || {}),
          airline: newOrder.fl_airline, pnr: newOrder.fl_pnr.trim().toUpperCase(), url: newOrder.fl_url.trim(),
          out: { date: newOrder.fl_out_date, time: newOrder.fl_out_time, no: newOrder.fl_out_no.trim(), arr: newOrder.fl_out_arr, airport: newOrder.fl_out_airport },
          ret: { date: newOrder.fl_ret_date, time: newOrder.fl_ret_time, no: newOrder.fl_ret_no.trim(), airport: newOrder.fl_ret_airport },
        } : null },
      customer_name: newOrder.customer_name, customer_email: newOrder.customer_email, customer_phone: newOrder.customer_phone,
    };

    setAddBusy(true);
    try {
      if (editingOrder) {
        // Editing an already-blocking order's apartment/dates: free its OLD
        // blocks first (a plain field update wouldn't move them — inventory
        // blocking only reacts to a status PATCH, and re-blocking under the
        // NEW apartment/dates in the same request wouldn't clear the old
        // ones), then update the fields and re-block under the new values.
        if (editingOrder.status === "approved" || editingOrder.status === "hold") {
          await authFetch(`/api/orders/${editingOrder.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "cancelled", silent: true }) });
        }
        await authFetch(`/api/orders/${editingOrder.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fields, status: newOrder.status, silent: true }) });
      } else {
        const post = (force: boolean) => authFetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...fields, apartment: apt.name, cancel: "none", service: "human", grand_total: newOrder.total_eur, force }),
        });
        let res = await post(false);
        let j = await res.json().catch(() => ({}));
        if (res.status === 409 && j.error === "dates_unavailable") {
          if (!confirm(`שים לב: הדירה כבר תפוסה בתאריכים ${(j.dates || []).join(", ")}.\nליצור את ההזמנה בכל זאת?`)) return;
          res = await post(true);
          j = await res.json().catch(() => ({}));
        }
        if (!res.ok || !j.code) { alert(j.error || "יצירת ההזמנה נכשלה"); return; }

        // POST only returns {code} — fetch the full list to find this row's id for the status PATCH.
        const list: Order[] = await authFetch("/api/orders").then(r => r.json());
        const created = list.find(o => o.code === j.code);
        if (created) await authFetch(`/api/orders/${created.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newOrder.status, ops: fields.ops }) });
      }

      closeForm();
      load();
    } finally {
      setAddBusy(false);
    }
  };

  const approve = async (o: Order) => {
    // no email on the order (a pay link from a quote or the bot): it can still be charged and approved, just no email goes out
    const charges = !!o.payplus_transaction_uid;
    const mailLine = o.customer_email ? `יישלח מייל אישור אל: ${o.customer_email}` : "⚠️ אין מייל בהזמנה, אז לא יישלח מייל אישור (אפשר להוסיף מייל בעריכה לפני כן)";
    const msg = charges
      ? `לחייב את הפיקדון ולאשר את ההזמנה של ${o.customer_name || o.code}?\nהכרטיס יחויב בפועל.\n${mailLine}`
      : `לאשר את ההזמנה של ${o.customer_name || o.code}? (אין פיקדון מקושר, רק אישור)\n${mailLine}`;
    if (!confirm(msg)) return;
    setBusy(o.id);
    const res = await authFetch("/api/payplus/capture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: o.id }) });
    const j = await res.json().catch(() => ({}));
    setBusy(null);
    if (res.ok) alert(`✓ ${charges ? "הפיקדון חויב ו" : ""}ההזמנה אושרה.${o.customer_email ? ` מייל אישור נשלח אל ${o.customer_email}` : " (בלי מייל: אין מייל בהזמנה)"}`);
    else alert(`שגיאה: ${j.error || "לא הצלחנו לאשר"}`);
    load();
  };

  // an order paid from a quote's link: everything the quote says goes into the order (and the personal area)
  const fillFromProposal = async (o: Order) => {
    setBusy(o.id);
    let r = await authFetch(`/api/orders/${o.id}/from-proposal`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    if (r.status === 404) {
      const n = prompt("לא מצאתי את ההצעה של ההזמנה הזו. מה מספר ההצעה? (למשל SK-2026-0062)");
      if (n) r = await authFetch(`/api/orders/${o.id}/from-proposal`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ number: n }) });
    }
    const j = await r.json().catch(() => ({}));
    setBusy(null);
    if (r.ok && j.ok) alert(`✓ הושלם מההצעה ${j.proposal}: ${[...(j.filled.apartments || []), j.filled.ski_pass && "סקי פס", j.filled.transfer && "הסעה", j.filled.equipment && "ציוד", j.filled.flight && "טיסות"].filter(Boolean).join(", ")}`);
    else if (r.status !== 404) alert(`שגיאה: ${j.error || "לא הצלחתי"}`);
    load();
  };

  // ===== קבלות ותשלומים: per-guest payments + a morning DRAFT receipt per payer =====
  type Receipt = { id?: string; number?: string; url?: string; at?: string; auto?: boolean; manual?: boolean };
  type PayRow = { name: string; amount: string; currency: "ILS" | "EUR"; method: string; receipt?: Receipt };
  const [payOrder, setPayOrder] = useState<Order | null>(null);
  const [payRows, setPayRows] = useState<PayRow[]>([]);
  const [payBusy, setPayBusy] = useState<number | null>(null);

  const openPayments = (o: Order) => {
    const saved = Array.isArray(o.ops?.x_payments) ? (o.ops!.x_payments as PayRow[]) : null;
    if (saved && saved.length) { setPayRows(saved.map(r => ({ name: String(r.name || ""), amount: String(r.amount || ""), currency: r.currency === "EUR" ? "EUR" : "ILS", method: String(r.method || ""), receipt: r.receipt }))); setPayOrder(o); return; }
    const names = String(o.customer_name || "").split(/\s*[,+]\s*|\s+ו-\s*/).map(n => n.trim()).filter(Boolean);
    const ils = Number(o.amount_ils) > 0;
    const rows: PayRow[] = (names.length ? names : ["לקוח/ה"]).map((name, i) => ({
      name,
      amount: i === 0 && o.payplus_transaction_uid ? String(ils ? o.amount_ils : o.total_eur) : "",
      currency: (ils || !o.payplus_transaction_uid ? "ILS" : "EUR") as "ILS" | "EUR",
      method: i === 0 && o.payplus_transaction_uid ? "card_link" : "",
    }));
    setPayRows(rows); setPayOrder(o);
  };

  const savePayments = async (rows: PayRow[]) => {
    if (!payOrder) return;
    const ops = { ...(payOrder.ops || {}), x_payments: rows };
    setOrders(prev => prev.map(x => x.id === payOrder.id ? { ...x, ops } : x));
    setPayOrder(prev => prev ? { ...prev, ops } : prev);
    await authFetch(`/api/orders/${payOrder.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ops: { x_payments: rows } }) });
  };

  // morning DRAFT (טיוטה) for one payer — unissued, no number, no email
  const rowReceiptDraft = async (i: number) => {
    if (!payOrder) return;
    const r0 = payRows[i];
    if (!r0.method) { alert("קודם לבחור איך שילם/ה"); return; }
    if (!(Number(r0.amount) > 0)) { alert("קודם למלא סכום"); return; }
    setPayBusy(i);
    await savePayments(payRows);
    const r = await authFetch("/api/admin/receipts/preview", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: payOrder.id, clientName: r0.name, amount: Number(r0.amount), currency: r0.currency, payMethod: r0.method }),
    });
    const j = await r.json().catch(() => ({}));
    setPayBusy(null);
    if (!r.ok || !j.draftUrl) { alert(`לא הצלחתי לשמור טיוטה במורנינג: ${j.error || "שגיאה"}`); return; }
    window.open(j.draftUrl, "_blank");
  };

  // ISSUE a real receipt in morning for one payer (explicit confirm first)
  const rowReceiptIssue = async (i: number) => {
    if (!payOrder) return;
    const r0 = payRows[i];
    if (!r0.method) { alert("קודם לבחור איך שילם/ה"); return; }
    if (!(Number(r0.amount) > 0)) { alert("קודם למלא סכום"); return; }
    const sign = r0.currency === "EUR" ? "€" : "₪";
    if (!confirm(`להפיק קבלה אמיתית במורנינג?\n\nעל שם: ${r0.name}\nסכום: ${sign}${Number(r0.amount).toLocaleString()}\n\nזה מסמך רשמי עם מספר (לא טיוטה). לא נשלח ללקוח שום מייל.`)) return;
    setPayBusy(i);
    await savePayments(payRows);
    const r = await authFetch("/api/admin/receipts/issue", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: payOrder.id, rowIndex: i, clientName: r0.name, amount: Number(r0.amount), currency: r0.currency, payMethod: r0.method }),
    });
    const j = await r.json().catch(() => ({}));
    setPayBusy(null);
    if (!r.ok || !j.receipt) { alert(`ההפקה נכשלה: ${j.error || "שגיאה"}`); return; }
    const rows = j.rows as PayRow[];
    setPayRows(rows);
    const ops = { ...(payOrder.ops || {}), x_payments: rows };
    setOrders(prev => prev.map(x => x.id === payOrder.id ? { ...x, ops } : x));
    setPayOrder(prev => prev ? { ...prev, ops } : prev);
  };

  // just MARK that a receipt exists (issued outside the site)
  const rowReceiptMark = (i: number) => {
    const rows = payRows.map((x, j) => j === i ? { ...x, receipt: x.receipt ? undefined : { manual: true, at: new Date().toISOString() } } : x);
    setPayRows(rows); savePayments(rows);
  };

  const setStatus = async (o: Order, status: string) => {
    setBusy(o.id);
    await authFetch(`/api/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBusy(null); load();
  };

  const remove = async (o: Order) => {
    if (!confirm("למחוק את ההזמנה?")) return;
    await authFetch(`/api/orders/${o.id}`, { method: "DELETE" });
    load();
  };

  // operational checklist (persisted in orders.ops)
  const toggleOp = async (o: Order, key: string) => {
    const ops = { ...(o.ops || {}), [key]: !(o.ops && o.ops[key]) };
    setOrders(prev => prev.map(x => x.id === o.id ? { ...x, ops } : x));   // optimistic
    await authFetch(`/api/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ops }) });
  };

  const checklistFor = (o: Order) => {
    const items = [{ key: "address", label: "שליחת כתובת ופרטי צ׳ק-אין ללקוח" }, { key: "keys", label: "הכנת מפתחות בדלת (48ש׳ לפני)" }];
    if (o.transfer) items.unshift({ key: "transfer", label: "תיאום שאטל/הסעה משדה התעופה" });
    if (o.flight) items.unshift({ key: "flight", label: "הזמנת כרטיסי הטיסה בפועל מול החברה" });
    return items;
  };

  // which orders the toolbar shows, grouped by the month of arrival
  const isPast = (o: Order) => !!today && !!(o.checkout || o.checkin) && String(o.checkout || o.checkin) < today;
  const inRange = orders.filter(o => range === "all" ? true : range === "past" ? isPast(o) : !isPast(o));
  const needle = q.trim().toLowerCase();
  const visible = inRange.filter(o =>
    (statusF === "all" || o.status === statusF) &&
    (!needle || [o.customer_name, o.code, o.apartment_name, o.extra_apartment_name, o.customer_phone, o.customer_email]
      .some(v => String(v ?? "").toLowerCase().includes(needle))));
  const countOf = (k: string) => k === "all" ? inRange.length : inRange.filter(o => o.status === k).length;
  const HE_M = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
  const sumOf = (list: Order[]) => Math.round(list.filter(o => o.status !== "cancelled").reduce((t, o) => t + (Number(o.total_eur) || 0), 0));
  let groups: { label: string; list: Order[]; sum: number }[];
  if (sort === "new") {
    const list = [...visible].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    groups = [{ label: "", list, sum: sumOf(list) }];
  } else {
    const by = new Map<string, Order[]>();
    for (const o of visible) { const k = o.checkin ? o.checkin.slice(0, 7) : "~none"; if (!by.has(k)) by.set(k, []); by.get(k)!.push(o); }
    const keys = [...by.keys()].sort((a, b) => range === "past" ? b.localeCompare(a) : a.localeCompare(b));
    groups = keys.map(k => ({
      label: k === "~none" ? "בלי תאריך הגעה" : `${HE_M[Number(k.slice(5, 7)) - 1]} ${k.slice(0, 4)}`,
      list: by.get(k)!.sort((a, b) => String(a.checkin || "").localeCompare(String(b.checkin || ""))),
      sum: sumOf(by.get(k)!),
    }));
  }
  const daysTo = (d: string | null) => d && today ? Math.round((Date.parse(d) - Date.parse(today)) / 864e5) : null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-gray-900">הזמנות</h1>
          <p className="text-gray-500 text-sm mt-1">חיפוש, אישור פיקדונות ומעקב לפי חודשי ההגעה</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
          + הוסף הזמנה חדשה
        </button>
      </div>

      {/* ── search and filters, sticky so they stay at hand on the phone too ── */}
      <div className="sticky top-0 z-20 bg-gray-50 pt-1 pb-3 mb-4 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="חיפוש: שם, קוד, דירה, טלפון, מייל…"
            className="w-full md:w-[280px] rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
          <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] max-w-full">
            {([["all", "הכל"], ["hold", "פיקדון לאישור"], ["approved", "אושרו"], ["awaiting", "ליד חם"], ["cancelled", "בוטלו"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setStatusF(k)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[13px] font-bold border transition ${statusF === k ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
                {l} · {countOf(k)}
              </button>
            ))}
          </div>
          <span className="hidden lg:block flex-1" />
          <div className="flex gap-1 rounded-full border border-gray-200 bg-white p-0.5" role="group" aria-label="קרובות או עבר">
            {([["upcoming", "קרובות"], ["past", "עבר"], ["all", "הכל"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setRange(k)} className={`px-3 py-1.5 rounded-full text-[13px] font-bold transition ${range === k ? "bg-blue-600 text-white" : "text-gray-600"}`}>{l}</button>
            ))}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value as "checkin" | "new")} aria-label="סידור"
            className="rounded-full border border-gray-200 bg-white px-3 py-2 text-[13px] font-bold text-gray-700 focus:outline-none cursor-pointer">
            <option value="checkin">לפי תאריך הגעה</option>
            <option value="new">אחרונות שנוספו</option>
          </select>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => !addBusy && closeForm()}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl my-8" onClick={e => e.stopPropagation()} dir="rtl">
            <h2 className="text-lg font-black text-gray-900 mb-1">{editingOrder ? `עריכת הזמנה — ${editingOrder.code}` : "הזמנה חדשה"}</h2>
            <p className="text-xs text-gray-400 mb-4">
              {editingOrder ? "שינוי דירה/תאריכים יעביר אוטומטית את החסימה בלוח הזמינות." : "להזמנות שסוכמו בטלפון/וואטסאפ וכד׳ — התאריכים ייחסמו לדירה מיד עם השמירה."}
            </p>
            <div className="space-y-3">
              <ApartmentPicker apartments={apartments} value={newOrder.apartment_id} excludeId={newOrder.extra_apartment_id || undefined}
                onChange={id => setNewOrder(v => ({ ...v, apartment_id: id }))} label="דירה" />

              {showExtraApt ? (
                <div className="relative">
                  <ApartmentPicker apartments={apartments} value={newOrder.extra_apartment_id} excludeId={newOrder.apartment_id || undefined}
                    onChange={id => setNewOrder(v => ({ ...v, extra_apartment_id: id }))} label="דירה נוספת (הזמנה משולבת)" />
                  <button type="button" onClick={() => { setShowExtraApt(false); setNewOrder(v => ({ ...v, extra_apartment_id: "" })); }}
                    className="absolute left-0 top-0 text-xs text-red-500 hover:text-red-700 font-medium">✕ הסר</button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowExtraApt(true)}
                  className="text-xs font-semibold text-blue-600 hover:underline">+ הוסף דירה נוספת (הזמנה משולבת בין כמה דירות)</button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-gray-500">הגעה
                  <input type="date" value={newOrder.checkin} onChange={e => setNewOrder(v => ({ ...v, checkin: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </label>
                <label className="text-xs text-gray-500">עזיבה
                  <input type="date" value={newOrder.checkout} onChange={e => setNewOrder(v => ({ ...v, checkout: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-gray-500">אורחים
                  <input type="number" min={1} value={newOrder.guests} onChange={e => setNewOrder(v => ({ ...v, guests: +e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </label>
                <label className="text-xs text-gray-500">סה״כ (€)
                  <input type="number" min={0} value={newOrder.total_eur} onChange={e => setNewOrder(v => ({ ...v, total_eur: +e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">כלול בהזמנה</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={newOrder.ski_pass} onChange={e => setNewOrder(v => ({ ...v, ski_pass: e.target.checked }))} className="w-4 h-4 rounded accent-amber-600" />
                    🎿 סקי פס
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={newOrder.transfer} onChange={e => setNewOrder(v => ({ ...v, transfer: e.target.checked }))} className="w-4 h-4 rounded accent-blue-600" />
                    🚐 הסעה
                  </label>
                  <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={newOrder.equipment} onChange={e => setNewOrder(v => ({ ...v, equipment: e.target.checked }))} className="w-4 h-4 rounded accent-amber-600" />
                    🎿 השכרת ציוד
                  </label>
                </div>
                <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer mt-3">
                  <input type="checkbox" checked={newOrder.flight} onChange={e => setNewOrder(v => ({ ...v, flight: e.target.checked }))} className="w-4 h-4 rounded accent-sky-600" />
                  ✈️ טיסה
                </label>
                {newOrder.ski_pass && (
                  <div className="flex gap-2 mt-2">
                    {[{ v: false, l: "סקי פס ואל טורנס" }, { v: true, l: "סקי פס מורחב: שלושת העמקים" }].map(x => (
                      <button key={String(x.v)} type="button" onClick={() => setNewOrder(o => ({ ...o, pass3v: x.v }))}
                        className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold ${newOrder.pass3v === x.v ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"}`}>{x.l}</button>
                    ))}
                  </div>
                )}
                {newOrder.flight && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <input placeholder="פרטי הטיסה, למשל: טרנסאוויה, הלוך 12.12 19:25 TLV→LYS, חזור 19.12 13:05" value={newOrder.flight_details} onChange={e => setNewOrder(v => ({ ...v, flight_details: e.target.value }))}
                      className="col-span-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="number" min={0} placeholder="מחיר (€, לא חובה)" value={newOrder.flight_price || ""} onChange={e => setNewOrder(v => ({ ...v, flight_price: +e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                )}
                {newOrder.flight && (
                  <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-3 mt-2 space-y-2">
                    <label className="text-xs font-bold text-sky-800 block">צ׳ק-אין לטיסה באזור האישי (+ מייל ללקוח 24 שעות לפני כל טיסה)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select value={newOrder.fl_airline} onChange={e => setNewOrder(v => ({ ...v, fl_airline: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        <option value="">חברת תעופה…</option>
                        {AIRLINES.map(a => <option key={a.key} value={a.key}>{a.name}</option>)}
                      </select>
                      <input placeholder="קוד הזמנה בחברה (PNR)" dir="ltr" value={newOrder.fl_pnr} onChange={e => setNewOrder(v => ({ ...v, fl_pnr: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono" />
                    </div>
                    <div className="grid grid-cols-[auto_1fr_90px_100px] gap-2 items-center">
                      <span className="text-xs font-bold text-gray-500">הלוך</span>
                      <input type="date" value={newOrder.fl_out_date} onChange={e => setNewOrder(v => ({ ...v, fl_out_date: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="time" value={newOrder.fl_out_time} onChange={e => setNewOrder(v => ({ ...v, fl_out_time: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input placeholder="מס׳ טיסה" dir="ltr" value={newOrder.fl_out_no} onChange={e => setNewOrder(v => ({ ...v, fl_out_no: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <span className="text-xs font-bold text-gray-500">חזור</span>
                      <input type="date" value={newOrder.fl_ret_date} onChange={e => setNewOrder(v => ({ ...v, fl_ret_date: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input type="time" value={newOrder.fl_ret_time} onChange={e => setNewOrder(v => ({ ...v, fl_ret_time: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <input placeholder="מס׳ טיסה" dir="ltr" value={newOrder.fl_ret_no} onChange={e => setNewOrder(v => ({ ...v, fl_ret_no: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button type="button" onClick={fillFlights} disabled={!newOrder.fl_out_no.trim() && !newOrder.fl_ret_no.trim()}
                        className="px-3 py-2 rounded-xl bg-sky-600 text-white text-sm font-bold disabled:opacity-40">✈️ מלא הכל לפי מספרי הטיסה</button>
                      {flMsg && <span className="text-xs text-gray-600">{flMsg}</span>}
                      {newOrder.fl_out_arr && <span className="text-xs text-gray-500">נחיתה הלוך: {newOrder.fl_out_arr} ({newOrder.fl_out_airport === "LYS" ? "ליון" : "ז׳נבה"})</span>}
                    </div>
                    <input placeholder="קישור מדויק לצ׳ק-אין (לא חובה, אחרת האתר של החברה)" dir="ltr" value={newOrder.fl_url} onChange={e => setNewOrder(v => ({ ...v, fl_url: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-right" />
                    <p className="text-[11px] text-gray-500">מספיק לכתוב מספרי טיסה וללחוץ ״מלא הכל״. שעות לפי השעון המקומי בשדה: הלוך שעון ישראל (המראה, לפי שעת הנחיתה), חזור שעון צרפת/שווייץ.</p>
                  </div>
                )}
                {newOrder.transfer && (
                  <input placeholder="פרטי ההסעה / טיסה לאיסוף (אופציונלי)" value={newOrder.transfer_details} onChange={e => setNewOrder(v => ({ ...v, transfer_details: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                )}
              </div>

              <div className="rounded-xl border border-gray-200 p-3 space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">פרטי הגעה לצ׳ק-אין (הלקוח רואה אחרי שעשה צ׳ק-אין לדירה)</label>
                <input placeholder="כתובת הדירה" value={newOrder.stay_address} onChange={e => setNewOrder(v => ({ ...v, stay_address: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input placeholder="קוד / מספר הזמנה לקבלה" dir="ltr" value={newOrder.stay_ref} onChange={e => setNewOrder(v => ({ ...v, stay_ref: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <textarea placeholder="הוראות כניסה (קוד לכספת, איפה הקבלה, חניה…)" rows={2} value={newOrder.stay_notes} onChange={e => setNewOrder(v => ({ ...v, stay_notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <input placeholder="שם הלקוח" value={newOrder.customer_name} onChange={e => setNewOrder(v => ({ ...v, customer_name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="טלפון" value={newOrder.customer_phone} onChange={e => setNewOrder(v => ({ ...v, customer_phone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input placeholder="אימייל" dir="ltr" value={newOrder.customer_email} onChange={e => setNewOrder(v => ({ ...v, customer_email: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">סטטוס</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setNewOrder(v => ({ ...v, status: "approved" }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border ${newOrder.status === "approved" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500"}`}>
                    אושר (שולח מייל אישור אם יש)
                  </button>
                  <button type="button" onClick={() => setNewOrder(v => ({ ...v, status: "hold" }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border ${newOrder.status === "hold" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-500"}`}>
                    פיקדון (חוסם, בלי מייל)
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={submitOrder} disabled={addBusy}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                {addBusy ? "שומר…" : editingOrder ? "שמור שינויים" : "שמור וחסום תאריכים"}
              </button>
              <button onClick={closeForm} disabled={addBusy}
                className="px-5 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">טוען...</div>
      ) : !orders.length ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 text-gray-500">אין הזמנות עדיין</div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 text-gray-500">
          לא נמצאו הזמנות לחיפוש או לסינון הזה.
          <button onClick={() => { setQ(""); setStatusF("all"); setRange("all"); }} className="block mx-auto mt-3 text-sm font-bold text-blue-600 hover:underline">ניקוי הסינון</button>
        </div>
      ) : (
        <div>
          {groups.map(g => (
            <section key={g.label || "list"} className="mb-8">
              {g.label && (
                <div className="flex items-baseline justify-between gap-3 mb-2.5 px-1">
                  <h2 className="text-lg font-black text-gray-900">{g.label}</h2>
                  <span className="text-sm text-gray-500">{g.list.length === 1 ? "הזמנה אחת" : `${g.list.length} הזמנות`} · €{g.sum.toLocaleString()}</span>
                </div>
              )}
              <div className="space-y-3">
          {g.list.map(o => {
            const st = STATUS[o.status] || STATUS.awaiting;
            return (
              <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
               <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-black text-gray-900">{o.customer_name || "לקוח/ה"}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                    <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">קוד: {o.code}</span>
                    {(() => { const d = daysTo(o.checkin); return d != null && d >= 0 && o.status !== "cancelled"
                      ? <span className="text-xs font-bold bg-gray-900 text-white px-2.5 py-1 rounded-full">{d === 0 ? "מגיעים היום" : d === 1 ? "מגיעים מחר" : `בעוד ${d} ימים`}</span>
                      : null; })()}
                  </div>
                  <p className="text-sm text-gray-600">{o.apartment_name} · {fmt(o.checkin)}–{fmt(o.checkout)} · {o.guests} אורחים · {o.nights} לילות</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <b className="text-sm text-gray-800">€{Number(o.total_eur).toLocaleString()}</b>
                    {o.customer_email && <> · {o.customer_email}</>}
                    {o.customer_phone && <> · {o.customer_phone}</>}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 md:flex-shrink-0">
                  {o.status !== "approved" && (
                    <button onClick={() => approve(o)} disabled={busy === o.id}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm px-4 py-2 rounded-xl transition">
                      {busy === o.id ? "מעבד…" : (o.payplus_transaction_uid ? "אשר וחייב פיקדון" : "אשר ושלח מייל")}
                    </button>
                  )}
                  {o.status !== "cancelled" && (
                    <button onClick={() => setStatus(o, "cancelled")} className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm px-3 py-2 rounded-xl transition">בטל</button>
                  )}
                  {(!o.apartment_id || /SK-\d{4}-/.test(o.apartment_name || "")) && !(o.ops && o.ops.x_proposal) && (
                    <button onClick={() => fillFromProposal(o)} disabled={busy === o.id} className="border border-violet-200 text-violet-700 hover:bg-violet-50 font-medium text-sm px-3 py-2 rounded-xl transition">השלם מההצעה</button>
                  )}
                  <button onClick={() => openPayments(o)} className="border border-teal-200 text-teal-700 hover:bg-teal-50 font-medium text-sm px-3 py-2 rounded-xl transition">💳 קבלות ותשלומים</button>
                  <button onClick={() => startEdit(o)} className="border border-gray-200 text-blue-600 hover:bg-blue-50 font-medium text-sm px-3 py-2 rounded-xl transition">עריכה</button>
                  <button onClick={() => remove(o)} className="text-red-500 hover:text-red-700 text-sm px-2">🗑</button>
                </div>
               </div>

                {/* add-ons summary chips */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {o.transfer && <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">🚐 הסעה{o.transfer_details ? ` · ${o.transfer_details}` : " · ללא פרטי טיסה"}</span>}
                  {o.ski_pass && <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">🎿 סקי פס</span>}
                  {o.equipment && <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">🎿 השכרת ציוד</span>}
                  {o.flight && <span className="text-xs font-semibold bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full">✈️ טיסה — לתפעל ידנית{o.flight_price ? ` · €${o.flight_price}` : ""}</span>}
                  <span className="text-xs font-semibold bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full">🛡️ {CANCEL_LABEL[o.cancel] || o.cancel}</span>
                  <span className="text-xs font-semibold bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full">{o.service === "ai" ? "🤖 AI" : "👤 שירות אנושי"}</span>
                  {o.group_id && <span className="text-xs font-semibold bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full">👥 תשלום מפוצל ({o.shares_total})</span>}
                  {o.extra_apartment_name && <span className="text-xs font-semibold bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full">+ {o.extra_apartment_name}</span>}
                  {(() => {
                    const rows = Array.isArray(o.ops?.x_payments) ? (o.ops!.x_payments as { method?: string; receipt?: unknown }[]) : [];
                    if (!rows.length) return null;
                    const got = rows.filter(r => r.receipt).length;
                    return (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${got === rows.length ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        🧾 קבלות {got}/{rows.length}
                      </span>
                    );
                  })()}
                </div>

                {(() => {
                  const ci = o.ops && typeof o.ops.x_checkin === "object" ? o.ops.x_checkin as { guests?: string[]; arrival?: string; phone?: string; notes?: string; at?: string } : null;
                  const st = o.ops && typeof o.ops.x_stay === "object" ? o.ops.x_stay as { address?: string; ref?: string } : null;
                  if (!ci && !(st && (st.address || st.ref))) return null;
                  return (
                    <div className={`mt-3 rounded-xl px-3 py-2.5 text-xs ${ci ? "bg-emerald-50 text-emerald-800" : "bg-gray-50 text-gray-600"}`}>
                      {ci ? <>
                        <p className="font-bold">✅ צ׳ק-אין לדירה בוצע{ci.at ? ` · ${new Date(ci.at).toLocaleDateString("he-IL")}` : ""}</p>
                        <p>אורחים: {(ci.guests || []).join(", ")}{ci.arrival ? ` · מגיעים: ${ci.arrival}` : ""}{ci.phone ? ` · טלפון: ${ci.phone}` : ""}</p>
                        {ci.notes && <p>הערה: {ci.notes}</p>}
                      </> : <p>עוד לא עשו צ׳ק-אין לדירה</p>}
                      {st && (st.address || st.ref)
                        ? <p className="mt-0.5 opacity-80">פרטי הגעה שהזנת: {[st.address, st.ref].filter(Boolean).join(" · ")}</p>
                        : <p className="mt-0.5 font-bold text-amber-700">חסרים פרטי הגעה (כתובת וקוד הזמנה): עריכה ← פרטי הגעה</p>}
                    </div>
                  );
                })()}

                {/* checklist toggle */}
                {(o.status === "hold" || o.status === "approved") && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => setOpen(p => ({ ...p, [o.id]: !p[o.id] }))} className="text-sm font-bold text-blue-600 hover:underline">
                      צ׳ק-ליסט לטיפול {open[o.id] ? "▲" : "▼"}
                      {(() => { const items = checklistFor(o); const done = items.filter(it => o.ops && o.ops[it.key]).length; return <span className="text-xs font-normal text-gray-400 mr-1"> ({done}/{items.length})</span>; })()}
                    </button>
                    {open[o.id] && (
                      <div className="mt-2 space-y-1.5">
                        {checklistFor(o).map(it => {
                          const checked = !!(o.ops && o.ops[it.key]);
                          return (
                            <label key={it.key} className="flex items-center gap-2.5 cursor-pointer text-sm py-1">
                              <input type="checkbox" checked={checked} onChange={() => toggleOp(o, it.key)} className="w-4 h-4 accent-emerald-600" />
                              <span className={checked ? "line-through text-gray-400" : "text-gray-700"}>{it.label}</span>
                            </label>
                          );
                        })}
                        {o.transfer && o.transfer_details && (
                          <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mt-1">✈️ פרטי טיסה (להסעה): {o.transfer_details}</p>
                        )}
                        {o.flight && o.flight_details && (
                          <p className="text-xs text-sky-700 bg-sky-50 rounded-lg px-3 py-2 mt-1">🎫 הלקוח הזמין טיסה כחלק מהחבילה — {o.flight_details}. יש להזמין בפועל מול חברת התעופה.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* קבלות ותשלומים — מי שילם, איך, וטיוטת קבלה במורנינג לכל אחד */}
      {payOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-0 md:p-6" onClick={() => setPayOrder(null)}>
          <div className="bg-white w-full md:max-w-2xl rounded-t-3xl md:rounded-3xl p-5 md:p-7 max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-1">
              <div>
                <h3 className="text-lg font-black text-gray-900">💳 קבלות ותשלומים</h3>
                <p className="text-sm text-gray-500">{payOrder.customer_name} · קוד {payOrder.code} · €{Number(payOrder.total_eur).toLocaleString()}{Number(payOrder.amount_ils) > 0 ? ` · שולם ₪${Number(payOrder.amount_ils).toLocaleString()} בלינק` : ""}</p>
              </div>
              <button onClick={() => setPayOrder(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none px-2">✕</button>
            </div>
            <p className="text-xs text-gray-400 mb-4">״טיוטה״ שומרת טיוטה בלבד במורנינג · ״הפק קבלה״ מפיק מסמך אמיתי עם מספר (אחרי אישור שלך) · מורנינג אף פעם לא שולח מייל ללקוח. חיוב פיקדון דרך ״אשר וחייב״ מפיק קבלה אוטומטית.</p>

            <div className="space-y-3">
              {payRows.map((r, i) => (
                <div key={i} className="border border-gray-100 rounded-2xl p-3.5 bg-gray-50/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <input value={r.name} onChange={e => setPayRows(rows => rows.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                      placeholder="שם" className="flex-1 min-w-[130px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    <button onClick={() => { const rows = payRows.filter((_, j) => j !== i); setPayRows(rows); savePayments(rows); }}
                      className="text-gray-300 hover:text-red-500 text-sm px-1" title="הסרת שורה">✕</button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <select value={r.method} onChange={e => { const rows = payRows.map((x, j) => j === i ? { ...x, method: e.target.value } : x); setPayRows(rows); savePayments(rows); }}
                      className="rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs font-bold text-gray-700 cursor-pointer focus:outline-none">
                      <option value="">💳 איך שילם/ה?</option>
                      {PAY_METHODS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                    </select>
                    <div className="flex items-center rounded-xl border border-gray-200 bg-white overflow-hidden">
                      <input value={r.amount} inputMode="decimal" onChange={e => setPayRows(rows => rows.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))}
                        onBlur={() => savePayments(payRows)} placeholder="סכום" className="w-24 px-3 py-2 text-sm font-bold focus:outline-none" />
                      <select value={r.currency} onChange={e => { const rows = payRows.map((x, j) => j === i ? { ...x, currency: (e.target.value === "EUR" ? "EUR" : "ILS") as "ILS" | "EUR" } : x); setPayRows(rows); savePayments(rows); }}
                        className="px-1.5 py-2 text-xs font-bold text-gray-500 bg-gray-50 border-r border-gray-200 cursor-pointer focus:outline-none">
                        <option value="ILS">₪</option>
                        <option value="EUR">€</option>
                      </select>
                    </div>
                    {r.receipt ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2 text-xs font-bold">
                        ✓ {r.receipt.manual ? "קיבל/ה קבלה (סומן ידנית)" : `קבלה ${r.receipt.number || ""}${r.receipt.auto ? " · אוטומטית" : ""}`}
                        {r.receipt.url && <a href={r.receipt.url} target="_blank" className="underline">צפייה</a>}
                        {r.receipt.manual && <button onClick={() => rowReceiptMark(i)} className="text-emerald-400 hover:text-red-500" title="ביטול הסימון">✕</button>}
                      </span>
                    ) : (
                      <>
                        <button onClick={() => rowReceiptDraft(i)} disabled={payBusy === i}
                          className="rounded-xl border border-teal-200 bg-teal-50 text-teal-800 px-3 py-2 text-xs font-bold hover:bg-teal-100 transition disabled:opacity-50">
                          🧾 {payBusy === i ? "רגע…" : "טיוטה"}
                        </button>
                        <button onClick={() => rowReceiptIssue(i)} disabled={payBusy === i}
                          className="rounded-xl bg-emerald-600 text-white px-3 py-2 text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50">
                          ✅ {payBusy === i ? "מפיק…" : "הפק קבלה"}
                        </button>
                        <button onClick={() => rowReceiptMark(i)}
                          className="text-xs font-bold text-gray-400 hover:text-emerald-700 px-1" title="סימון בלבד — אם הקבלה הופקה מחוץ לאתר">
                          סמן שקיבל/ה
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setPayRows(rows => [...rows, { name: "", amount: "", currency: "ILS", method: "" }])}
              className="mt-3 text-sm font-bold text-teal-700 hover:text-teal-900">+ הוספת תשלום</button>
          </div>
        </div>
      )}
    </div>
  );
}
