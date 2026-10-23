import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DICT } from "@/lib/intl/dict";

export const metadata: Metadata = { title: { absolute: DICT.fr.meta.notFoundTitle }, robots: { index: false } };

// static like the other /fr pages. The status stays 200 (with noindex): the root
// app/loading.tsx wraps every route in a Suspense boundary, and notFound() inside one
// can't change the status any more (same for the Hebrew notFound() pages).
export const revalidate = 3600;
export async function generateStaticParams() {
  return [];
}

/** Any other /fr/… URL: the English/French 404, inside the /fr frame. */
export default function NotFoundPage() {
  notFound();
}
