import type { Metadata } from "next";
import Terms from "@/components/intl/legal/Terms";
import { DICT } from "@/lib/intl/dict";
import { pageMetadata } from "@/lib/intl/metadata";

export const metadata: Metadata = pageMetadata("en", "/terms", { title: DICT.en.meta.termsTitle, description: DICT.en.meta.termsDesc });

export default function Page() {
  return <Terms lang="en" />;
}
