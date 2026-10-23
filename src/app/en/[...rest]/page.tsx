import { notFound } from "next/navigation";

// rendered statically (not streamed), so the 404 status reaches the browser and crawlers
export const revalidate = 3600;
export async function generateStaticParams() {
  return [];
}

/** Any other /en/… URL: the English/French 404, inside the /en frame. */
export default function NotFoundPage() {
  notFound();
}
