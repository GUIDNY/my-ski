import type { Metadata } from "next";
import PayBreakOut from "@/components/PayBreakOut";

// a personal or step-in-a-flow page: not for search results
export const metadata: Metadata = { title: "תשלום — SkiShare", robots: { index: false, follow: true } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <><PayBreakOut />{children}</>;
}
