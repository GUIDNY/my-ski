import type { Metadata } from "next";
import GuidesHub from "@/components/intl/GuidesHub";
import { DICT } from "@/lib/intl/dict";
import { pageMetadata } from "@/lib/intl/metadata";

export const metadata: Metadata = pageMetadata("en", "/guide", { title: DICT.en.guides.hubMetaTitle, description: DICT.en.guides.hubMetaDesc });

export default function Page() {
  return <GuidesHub lang="en" />;
}
