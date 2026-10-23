import type { Metadata } from "next";
import Terms from "@/components/intl/legal/Terms";
import { DICT } from "@/lib/intl/dict";
import { pageMetadata } from "@/lib/intl/metadata";

export const metadata: Metadata = pageMetadata("fr", "/terms", { title: DICT.fr.meta.termsTitle, description: DICT.fr.meta.termsDesc });

export default function Page() {
  return <Terms lang="fr" />;
}
