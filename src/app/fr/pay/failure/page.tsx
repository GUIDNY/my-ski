import type { Metadata } from "next";
import { PayFailure } from "@/components/intl/PayResult";
import { DICT } from "@/lib/intl/dict";
import { pageMetadata } from "@/lib/intl/metadata";

export const metadata: Metadata = pageMetadata("fr", "/pay/failure", { title: DICT.fr.meta.payFailTitle, description: DICT.fr.meta.siteDesc, noindex: true });

export default function Page() {
  return <PayFailure lang="fr" />;
}
