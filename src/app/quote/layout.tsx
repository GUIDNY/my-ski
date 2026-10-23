import type { Metadata } from "next";

// A personal price offer (and its printable page): not for search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function QuoteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
