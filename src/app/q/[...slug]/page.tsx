"use client";
import SkiLoader from "@/components/SkiLoader";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import QuoteView, { QuoteNotFound, type QuoteData } from "@/components/QuoteView";
import OpenInAppBanner from "@/components/OpenInAppBanner";

export default function ShortQuotePage() {
  const { slug } = useParams<{ slug: string[] }>();
  const [q, setQ] = useState<QuoteData | null>(null);
  const [notFound, setNotFound] = useState(false);

  // last path segment is the short id (e.g. /q/נבס-93/a7k2)
  const id = Array.isArray(slug) ? slug[slug.length - 1] : slug;

  useEffect(() => {
    if (!id) return;
    fetch(`/api/quotes/${id}`)
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
        cancel:      d.cancel ?? "none",
        service:     d.service ?? "human",
        aptTotal:    Number(d.apt_total ?? 0),
        grandTotal:  Number(d.grand_total ?? 0),
      }))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <QuoteNotFound />;

  if (!q) return <SkiLoader label="רגע, פותחים את ההצעה…" />;

  return <><OpenInAppBanner /><QuoteView q={q} /></>;
}
