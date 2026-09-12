"use client";
import { useEffect, useState } from "react";
import type { Order, Apartment } from "@/types";

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
};

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

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/orders");
    setOrders(await r.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { fetch("/api/apartments?all=1").then(r => r.json()).then(setApartments).catch(() => {}); }, []);

  // Manually add a real booking (e.g. taken by phone) — this is the only
  // way an admin-created order actually blocks its dates: POST /api/orders
  // never sets a status (so it defaults to "awaiting", which doesn't block
  // anything — see PATCH /api/orders/[id]), so we immediately follow up
  // with a status PATCH, same as approving/holding any other order.
  const addOrder = async () => {
    const apt = apartments.find(a => a.id === newOrder.apartment_id);
    if (!apt) { alert("בחר/י דירה"); return; }
    if (!newOrder.checkin || !newOrder.checkout) { alert("בחר/י תאריכי הגעה ועזיבה"); return; }
    if (newOrder.checkout <= newOrder.checkin) { alert("תאריך העזיבה חייב להיות אחרי תאריך ההגעה"); return; }
    if (!newOrder.customer_name.trim()) { alert("הזן/י שם לקוח"); return; }
    const extraApt = newOrder.extra_apartment_id ? apartments.find(a => a.id === newOrder.extra_apartment_id) : null;

    setAddBusy(true);
    try {
      const nights = Math.round((+new Date(newOrder.checkout) - +new Date(newOrder.checkin)) / 86400000);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartment_id: apt.id, apartment: apt.name,
          extra_apartment_id: extraApt?.id || null, extra_apartment_name: extraApt?.name || null,
          checkin: newOrder.checkin, checkout: newOrder.checkout, guests: newOrder.guests, nights,
          cancel: "none", service: "human", grand_total: newOrder.total_eur,
          ski_pass: newOrder.ski_pass, transfer: newOrder.transfer, equipment: newOrder.equipment,
          transfer_details: newOrder.transfer ? newOrder.transfer_details : "",
          customer_name: newOrder.customer_name, customer_email: newOrder.customer_email, customer_phone: newOrder.customer_phone,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.code) { alert(j.error || "יצירת ההזמנה נכשלה"); return; }

      // POST only returns {code} — fetch the full list to find this row's id for the status PATCH.
      const list: Order[] = await fetch("/api/orders").then(r => r.json());
      const created = list.find(o => o.code === j.code);
      if (created) await fetch(`/api/orders/${created.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newOrder.status }) });

      setShowAdd(false);
      setNewOrder(EMPTY_NEW_ORDER);
      setShowExtraApt(false);
      load();
    } finally {
      setAddBusy(false);
    }
  };

  const approve = async (o: Order) => {
    if (!o.customer_email) { alert("⚠️ אין מייל ללקוח בהזמנה — לא יישלח אישור."); return; }
    const charges = !!o.payplus_transaction_uid;
    const msg = charges
      ? `לחייב את הפיקדון ולאשר את ההזמנה של ${o.customer_name || o.code}?\nהכרטיס יחויב בפועל ויישלח מייל אישור אל: ${o.customer_email}`
      : `לאשר את ההזמנה של ${o.customer_name || o.code}? (אין פיקדון מקושר — רק אישור + מייל)\nמייל יישלח אל: ${o.customer_email}`;
    if (!confirm(msg)) return;
    setBusy(o.id);
    const res = await fetch("/api/payplus/capture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: o.id }) });
    const j = await res.json().catch(() => ({}));
    setBusy(null);
    if (res.ok) alert(`✓ ${charges ? "הפיקדון חויב ו" : ""}ההזמנה אושרה. מייל אישור נשלח אל ${o.customer_email}`);
    else alert(`שגיאה: ${j.error || "לא הצלחנו לאשר"}`);
    load();
  };

  const setStatus = async (o: Order, status: string) => {
    setBusy(o.id);
    await fetch(`/api/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBusy(null); load();
  };

  const remove = async (o: Order) => {
    if (!confirm("למחוק את ההזמנה?")) return;
    await fetch(`/api/orders/${o.id}`, { method: "DELETE" });
    load();
  };

  // operational checklist (persisted in orders.ops)
  const toggleOp = async (o: Order, key: string) => {
    const ops = { ...(o.ops || {}), [key]: !(o.ops && o.ops[key]) };
    setOrders(prev => prev.map(x => x.id === o.id ? { ...x, ops } : x));   // optimistic
    await fetch(`/api/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ops }) });
  };

  const checklistFor = (o: Order) => {
    const items = [{ key: "address", label: "שליחת כתובת ופרטי צ׳ק-אין ללקוח" }, { key: "keys", label: "הכנת מפתחות בדלת (48ש׳ לפני)" }];
    if (o.transfer) items.unshift({ key: "transfer", label: "תיאום שאטל/הסעה משדה התעופה" });
    return items;
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">הזמנות</h1>
          <p className="text-gray-500 text-sm mt-1">אישור פיקדונות ושליחת אישור הזמנה ללקוח</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
          + הוסף הזמנה חדשה
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => !addBusy && setShowAdd(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl my-8" onClick={e => e.stopPropagation()} dir="rtl">
            <h2 className="text-lg font-black text-gray-900 mb-1">הזמנה חדשה</h2>
            <p className="text-xs text-gray-400 mb-4">להזמנות שסוכמו בטלפון/וואטסאפ וכד׳ — התאריכים ייחסמו לדירה מיד עם השמירה.</p>
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
                {newOrder.transfer && (
                  <input placeholder="פרטי טיסה (אופציונלי)" value={newOrder.transfer_details} onChange={e => setNewOrder(v => ({ ...v, transfer_details: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                )}
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
              <button onClick={addOrder} disabled={addBusy}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                {addBusy ? "שומר…" : "שמור וחסום תאריכים"}
              </button>
              <button onClick={() => setShowAdd(false)} disabled={addBusy}
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
      ) : (
        <div className="space-y-3">
          {orders.map(o => {
            const st = STATUS[o.status] || STATUS.awaiting;
            return (
              <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
               <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-black text-gray-900">{o.customer_name || "לקוח/ה"}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                    <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded">קוד: {o.code}</span>
                  </div>
                  <p className="text-sm text-gray-600">{o.apartment_name} · {fmt(o.checkin)}–{fmt(o.checkout)} · {o.guests} אורחים · {o.nights} לילות</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    €{Number(o.total_eur).toLocaleString()}
                    {o.customer_email && <> · {o.customer_email}</>}
                    {o.customer_phone && <> · {o.customer_phone}</>}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {o.status !== "approved" && (
                    <button onClick={() => approve(o)} disabled={busy === o.id}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm px-4 py-2 rounded-xl transition">
                      {busy === o.id ? "מעבד…" : (o.payplus_transaction_uid ? "אשר וחייב פיקדון" : "אשר ושלח מייל")}
                    </button>
                  )}
                  {o.status !== "cancelled" && (
                    <button onClick={() => setStatus(o, "cancelled")} className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm px-3 py-2 rounded-xl transition">בטל</button>
                  )}
                  <button onClick={() => remove(o)} className="text-red-500 hover:text-red-700 text-sm px-2">🗑</button>
                </div>
               </div>

                {/* add-ons summary chips */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {o.transfer && <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">🚐 הסעה{o.transfer_details ? ` · ${o.transfer_details}` : " · ללא פרטי טיסה"}</span>}
                  {o.ski_pass && <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">🎿 סקי פס</span>}
                  {o.equipment && <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">🎿 השכרת ציוד</span>}
                  <span className="text-xs font-semibold bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full">🛡️ {CANCEL_LABEL[o.cancel] || o.cancel}</span>
                  <span className="text-xs font-semibold bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full">{o.service === "ai" ? "🤖 AI" : "👤 שירות אנושי"}</span>
                  {o.group_id && <span className="text-xs font-semibold bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full">👥 תשלום מפוצל ({o.shares_total})</span>}
                  {o.extra_apartment_name && <span className="text-xs font-semibold bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full">+ {o.extra_apartment_name}</span>}
                </div>

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
                          <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mt-1">✈️ פרטי טיסה: {o.transfer_details}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
