import type { Metadata } from "next";
import ApartmentsPage from "@/components/intl/ApartmentsPage";
import { DICT } from "@/lib/intl/dict";
import { pageMetadata } from "@/lib/intl/metadata";

// a static page, regenerated in the background at most every 5 minutes; the
// dates and guests of a search (?checkin&checkout&guests) are applied in the browser
export const revalidate = 300;

export const metadata: Metadata = pageMetadata("en", "/apartments", { title: DICT.en.meta.listTitle, description: DICT.en.meta.listDesc });

export default function Page() {
  return <ApartmentsPage lang="en" />;
}
