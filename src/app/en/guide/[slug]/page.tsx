import type { Metadata } from "next";
import GuidePage, { guideMetadata, guideParams } from "@/components/intl/GuidePage";

// only the guides that exist (any other address is a 404). Static, rebuilt at
// most every hour in the background: the live week table's prices are in the
// HTML search engines read (the table also refreshes in the browser). The
// addresses are plain ASCII, so the background rebuild is safe here.
export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return guideParams("en");
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return guideMetadata("en", slug);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <GuidePage lang="en" slug={slug} />;
}
