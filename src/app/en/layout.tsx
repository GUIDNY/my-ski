import type { Metadata } from "next";
import type { ReactNode } from "react";
import IntlShell from "@/components/intl/IntlShell";
import { layoutMetadata } from "@/lib/intl/metadata";

export const metadata: Metadata = layoutMetadata("en");

/** Everything under /en: the left-to-right frame (see components/intl/IntlShell.tsx). */
export default function Layout({ children }: { children: ReactNode }) {
  return <IntlShell lang="en">{children}</IntlShell>;
}
