import type { Metadata } from "next";
import { PayFailure } from "@/components/intl/PayResult";
import { DICT } from "@/lib/intl/dict";
import { pageMetadata } from "@/lib/intl/metadata";

export const metadata: Metadata = pageMetadata("en", "/pay/failure", { title: DICT.en.meta.payFailTitle, description: DICT.en.meta.siteDesc, noindex: true });

export default function Page() {
  return <PayFailure lang="en" />;
}
