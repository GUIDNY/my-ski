import type { Metadata } from "next";
import { Suspense } from "react";
import { PaySuccess } from "@/components/intl/PayResult";
import { DICT } from "@/lib/intl/dict";
import { pageMetadata } from "@/lib/intl/metadata";

export const metadata: Metadata = pageMetadata("fr", "/pay/success", { title: DICT.fr.meta.paySuccessTitle, description: DICT.fr.meta.siteDesc, noindex: true });

export default function Page() {
  return <Suspense fallback={<div className="flex-1 bg-soft" />}><PaySuccess lang="fr" /></Suspense>;
}
