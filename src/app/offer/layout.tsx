import type { Metadata } from "next";

// a personal or step-in-a-flow page: not for search results
export const metadata: Metadata = { title: "הצעה — SkiShare", robots: { index: false, follow: true } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
