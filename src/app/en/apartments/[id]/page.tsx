import type { Metadata } from "next";
import ApartmentPage, { apartmentMetadata } from "@/components/intl/apartment/ApartmentPage";

type Props = { params: Promise<{ id: string }> };

// one static page per apartment, made on its first visit and regenerated in
// the background at most every 5 minutes; an unknown id is a real 404
export const revalidate = 300;
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return apartmentMetadata("en", id);
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <ApartmentPage lang="en" id={id} />;
}
