"use client";
import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Apartment } from "@/types";
import { createApartmentSlug } from "@/lib/slugs";
import {
  IconMountain, IconBed, IconCheck, IconWifi, IconFire,
  IconParking, IconSnowflake, IconChevronLeft, IconMail, IconPhone,
} from "@/components/Icons";

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  "WiFi":       <IconWifi size={15} />,
  "אח":         <IconFire size={15} />,
  "חניה":       <IconParking size={15} />,
  "ג'קוזי":     <IconSnowflake size={15} />,
};

function Gallery({ images, name }: { images: string[]; name: string }) {
  const [idx, setIdx] = useState(0);
  const imgs = images?.length ? images : ["/apt1.jpg", "/apt2.jpg", "/apt3.jpg"];

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gray-100 h-96 md:h-[500px] group">
      <img src={imgs[idx]} alt={name} className="w-full h-full object-cover transition-all duration-500" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 50%)" }} />

      {imgs.length > 1 && (
        <>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {imgs.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"}`} />
            ))}
          </div>

          <button onClick={() => setIdx(i => (i - 1 + imgs.length) % imgs.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10">
            <IconChevronLeft size={18} className="rotate-180" />
          </button>
          <button onClick={() => setIdx(i => (i + 1) % imgs.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10">
            <IconChevronLeft size={18} />
          </button>
        </>
      )}
    </div>
  );
}

function OfferPage() {
  const { slug } = useParams<{ slug: string }>();
  const [apt, setApt] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/apartments`)
      .then(r => r.json())
      .then(apts => {
        if (Array.isArray(apts)) {
          const found = apts.find(a => createApartmentSlug(a) === slug);
          setApt(found || null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!apt) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 text-lg" dir="rtl">
      הצעה לא נמצאה
    </div>
  );

  const bankDetails = {
    bank: process.env.NEXT_PUBLIC_BANK_NAME || "בנק הפועלים",
    iban: process.env.NEXT_PUBLIC_BANK_IBAN || "IL62012673000000026026",
    account: process.env.NEXT_PUBLIC_BANK_ACCOUNT || "SKISHARE - GUINDY IDAN AND MIZRAHI AMIT",
    swift: process.env.NEXT_PUBLIC_BANK_SWIFT || "POALILIT",
  };

  const amenityIcon = (a: string) => AMENITY_ICONS[a] ?? <IconCheck size={15} />;

  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="flex items-center gap-2 font-black text-gray-900 hover:text-blue-600 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <IconMountain size={16} className="text-white" />
            </div>
            MySki
          </a>
          <span className="text-gray-200">/</span>
          <span className="text-sm text-gray-700 font-semibold truncate">{apt.name}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Gallery */}
        <Gallery images={apt.images} name={apt.name} />

        {/* Content */}
        <div className="mt-8 space-y-8">

          {/* Title & Basic Info */}
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-blue-600 mb-2">{apt.type}</div>
            <h1 className="text-4xl font-black text-gray-900 mb-3">{apt.name}</h1>
            <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
              <IconMountain size={14} className="text-blue-500" />
              Val Thorens, Trois Vallées, France
            </div>

            {/* Quick Stats */}
            <div className="flex gap-5 text-sm text-gray-600 flex-wrap">
              <span className="flex items-center gap-1.5 font-semibold">
                <IconBed size={15} className="text-gray-400" />
                {apt.beds} חדרי שינה
              </span>
              <span className="text-gray-300">·</span>
              <span className="font-semibold">{apt.baths} חדרי רחצה</span>
              <span className="text-gray-300">·</span>
              <span className="font-semibold">{apt.sqm} מ״ר</span>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Price */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <p className="text-gray-600 text-sm font-semibold mb-2">מחיר לילה</p>
            <div className="text-4xl font-black text-gray-900">
              €{apt.price_per_night.toLocaleString()}
            </div>
          </div>

          {/* Description */}
          {apt.description && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-3">על הדירה</h2>
              <p className="text-gray-600 leading-relaxed">{apt.description}</p>
            </div>
          )}

          {/* Amenities */}
          {apt.amenities?.length > 0 && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-4">מה כלול</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {apt.amenities.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-700 p-3 bg-gray-50 rounded-xl">
                    <span className="text-blue-500 flex-shrink-0">{amenityIcon(a)}</span>
                    <span className="font-medium">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bank Transfer */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
            <h2 className="text-2xl font-black text-gray-900 mb-4">עלויות התשלום</h2>
            <p className="text-gray-600 text-sm mb-4">העברה בנקאית לחשבון הדירה:</p>

            <div className="space-y-3 bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex justify-between items-start">
                <span className="text-gray-500 font-medium">בנק</span>
                <span className="font-semibold text-gray-900 text-right">{bankDetails.bank}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-500 font-medium">IBAN</span>
                <span className="font-mono font-bold text-gray-900 text-right text-sm">{bankDetails.iban}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-500 font-medium">SWIFT</span>
                <span className="font-semibold text-gray-900 text-right">{bankDetails.swift}</span>
              </div>
              <div className="flex justify-between items-start pt-3 border-t border-gray-100">
                <span className="text-gray-500 font-medium">שם בעלים</span>
                <span className="font-semibold text-gray-900 text-right">{bankDetails.account}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              ✓ בעד קבלת ההעברה, אנחנו נאשר את ההזמנה והדירה תהיה שלך
            </p>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="tel:+972547701899"
              className="flex items-center justify-center gap-3 py-4 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-sm">
              <IconPhone size={18} />
              <span>התקשר</span>
            </a>
            <a href="mailto:skishareteam@gmail.com"
              className="flex items-center justify-center gap-3 py-4 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-900 font-bold transition-colors">
              <IconMail size={18} />
              <span>שלח הודעה</span>
            </a>
          </div>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              עמוד זה שלך — שלח אותו ללקוחות
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {typeof window !== 'undefined' && window.location.href}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function OfferPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OfferPage />
    </Suspense>
  );
}
