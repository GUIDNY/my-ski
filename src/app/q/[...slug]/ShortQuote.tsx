"use client";
import SkiLoader from "@/components/SkiLoader";
import { useEffect, useState } from "react";
import QuoteView, { QuoteNotFound, type QuoteData } from "@/components/QuoteView";
import OpenInAppBanner from "@/components/OpenInAppBanner";
import { decodeExtras } from "@/lib/quote-extras";

/** A saved quote (/q/<name>/<id>), with the add-ons from the link (?x=). */
export default function ShortQuote({ id, x }: { id: string; x: string | null }) {
  const [q, setQ] = useState<QuoteData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/quotes/${encodeURIComponent(id)}`)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => setQ({
        apartmentId: d.apartment_id ?? "",
        apartment:   d.apartment_name ?? "דירה",
        checkin:     d.checkin ?? "",
        checkout:    d.checkout ?? "",
        guests:      d.guests ?? 2,
        nights:      d.nights ?? 1,
        skiPass:     !!d.ski_pass,
        transfer:    !!d.transfer,
        equipment:   !!d.equipment,
        cancel:      d.cancel ?? "none",
        service:     d.service ?? "human",
        aptTotal:    Number(d.apt_total ?? 0),
        grandTotal:  Number(d.grand_total ?? 0),
        extras:      decodeExtras(x),
        quoteId:     id,
      }))
      .catch(() => setNotFound(true));
  }, [id, x]);

  if (notFound) return <QuoteNotFound />;
  if (!q) return <SkiLoader label="רגע, פותחים את ההצעה…" />;
  return <><OpenInAppBanner /><QuoteView q={q} /></>;
}
