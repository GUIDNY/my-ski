"use client";
import SkiLoader from "@/components/SkiLoader";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import QuoteView, { type QuoteData } from "@/components/QuoteView";

function QuotePage() {
  const params = useSearchParams();
  const q: QuoteData = {
    apartmentId: params.get("apartment_id") ?? "",
    apartment:   params.get("apartment") ?? "דירה",
    checkin:     params.get("checkin") ?? "",
    checkout:    params.get("checkout") ?? "",
    guests:      parseInt(params.get("guests") ?? "2"),
    nights:      parseInt(params.get("nights") ?? "1"),
    skiPass:     params.get("ski_pass") === "true",
    transfer:    params.get("transfer") === "true",
    cancel:      params.get("cancel") ?? "none",
    service:     params.get("service") ?? "human",
    aptTotal:    parseInt(params.get("apt_total") ?? "0"),
    grandTotal:  parseInt(params.get("grand_total") ?? "0"),
  };
  return <QuoteView q={q} />;
}

export default function QuotePageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
        <SkiLoader />
      </div>
    }>
      <QuotePage />
    </Suspense>
  );
}
