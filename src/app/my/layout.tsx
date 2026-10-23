import type { Metadata } from "next";

// a personal page: not for search results
export const metadata: Metadata = { title: "האזור האישי — SkiShare", robots: { index: false, follow: true } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
