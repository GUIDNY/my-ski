import type { Metadata } from "next";
import GuidesHub from "@/components/intl/GuidesHub";
import { DICT } from "@/lib/intl/dict";
import { pageMetadata } from "@/lib/intl/metadata";

export const metadata: Metadata = pageMetadata("fr", "/guide", { title: DICT.fr.guides.hubMetaTitle, description: DICT.fr.guides.hubMetaDesc });

export default function Page() {
  return <GuidesHub lang="fr" />;
}
