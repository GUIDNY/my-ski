import type { Metadata } from "next";
import Privacy from "@/components/intl/legal/Privacy";
import { DICT } from "@/lib/intl/dict";
import { pageMetadata } from "@/lib/intl/metadata";

export const metadata: Metadata = pageMetadata("en", "/privacy", { title: DICT.en.meta.privacyTitle, description: DICT.en.meta.privacyDesc });

export default function Page() {
  return <Privacy lang="en" />;
}
