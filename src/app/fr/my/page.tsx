import type { Metadata } from "next";
import { Suspense } from "react";
import MyBooking from "@/components/intl/MyBooking";
import { DICT } from "@/lib/intl/dict";
import { pageMetadata } from "@/lib/intl/metadata";

export const metadata: Metadata = pageMetadata("fr", "/my", { title: "Ma réservation | SkiShare", description: DICT.fr.meta.siteDesc, noindex: true });

export default function Page() {
  return <Suspense fallback={<div className="flex-1 bg-soft" />}><MyBooking lang="fr" /></Suspense>;
}
