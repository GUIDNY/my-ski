import type { Metadata } from "next";
import Privacy from "@/components/intl/legal/Privacy";
import { DICT } from "@/lib/intl/dict";
import { pageMetadata } from "@/lib/intl/metadata";

export const metadata: Metadata = pageMetadata("fr", "/privacy", { title: DICT.fr.meta.privacyTitle, description: DICT.fr.meta.privacyDesc });

export default function Page() {
  return <Privacy lang="fr" />;
}
