import type { Metadata } from "next";
import { IntlNotFound } from "@/components/intl/StatusPages";
import { DICT } from "@/lib/intl/dict";

export const metadata: Metadata = { title: { absolute: DICT.en.meta.notFoundTitle }, robots: { index: false } };

export default function NotFound() {
  return <IntlNotFound lang="en" />;
}
