import type { Metadata } from "next";
import ShortQuote from "./ShortQuote";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const idOf = (slug: string[] | string) => (Array.isArray(slug) ? slug[slug.length - 1] : slug) ?? "";
const extrasOf = (sp: Record<string, string | string[] | undefined>) => (typeof sp.x === "string" && /^[a-z0-9-]{1,60}$/i.test(sp.x) ? sp.x : null);

// A personal link: not for search results. On iPhone, Safari's own app banner
// opens this same quote in the app (app-argument) when the app is installed.
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const id = idOf((await params).slug);
  const x = extrasOf(await searchParams);
  return {
    title: "הצעת מחיר — SkiShare",
    robots: { index: false, follow: false },
    itunes: { appId: "6782095727", appArgument: `https://skisharebook.com/q/${encodeURIComponent(id)}${x ? `?x=${x}` : ""}` },
  };
}

// last path segment is the short id (e.g. /q/נבס-93/a7k2)
export default async function ShortQuotePage({ params, searchParams }: Props) {
  const id = idOf((await params).slug);
  const x = extrasOf(await searchParams);
  return <ShortQuote id={id} x={x} />;
}
