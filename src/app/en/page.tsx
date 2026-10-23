import type { Metadata } from "next";
import HomePage from "@/components/intl/HomePage";
import { DICT } from "@/lib/intl/dict";
import { pageMetadata } from "@/lib/intl/metadata";

// live apartments and prices: regenerated in the background at most every 5 minutes
export const revalidate = 300;

export const metadata: Metadata = pageMetadata("en", "", { title: DICT.en.meta.homeTitle, description: DICT.en.meta.homeDesc });

export default function Page() {
  return <HomePage lang="en" />;
}
