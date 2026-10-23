import type { Metadata } from "next";
import { Suspense } from "react";
import { PaySuccess } from "@/components/intl/PayResult";
import { DICT } from "@/lib/intl/dict";
import { pageMetadata } from "@/lib/intl/metadata";

export const metadata: Metadata = pageMetadata("en", "/pay/success", { title: DICT.en.meta.paySuccessTitle, description: DICT.en.meta.siteDesc, noindex: true });

export default function Page() {
  return <Suspense fallback={<div className="flex-1 bg-soft" />}><PaySuccess lang="en" /></Suspense>;
}
