import type { Metadata } from "next";
import { Suspense } from "react";
import MyBooking from "@/components/intl/MyBooking";
import { DICT } from "@/lib/intl/dict";
import { pageMetadata } from "@/lib/intl/metadata";

export const metadata: Metadata = pageMetadata("en", "/my", { title: "My booking | SkiShare", description: DICT.en.meta.siteDesc, noindex: true });

export default function Page() {
  return <Suspense fallback={<div className="flex-1 bg-soft" />}><MyBooking lang="en" /></Suspense>;
}
