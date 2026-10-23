import { redirect } from "next/navigation";

/*
 * The old booking form. Nothing links here any more, its card fields were
 * never sent anywhere, and booking happens on the apartment page (or in a
 * quote). Old links land on the apartment with the same dates, or on search.
 */
export default async function OldBookPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const q = new URLSearchParams();
  for (const k of ["checkin", "checkout", "guests"]) if (one(k)) q.set(k, one(k));
  if (one("transfer") === "true") q.set("transfer", "1");
  const qs = q.toString() ? `?${q}` : "";
  const apt = one("apartment_id");
  redirect(/^[0-9a-f-]{36}$/i.test(apt) ? `/apartments/${apt}${qs}` : `/search${qs}`);
}
