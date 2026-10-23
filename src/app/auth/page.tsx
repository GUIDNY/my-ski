"use client";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/AuthModal";

export default function AuthPage() {
  const router = useRouter();
  return (
    <div className="flex-1 bg-soft flex items-start md:items-center justify-center px-4 py-8 md:py-16" dir="rtl">
      <div className="w-full max-w-[460px] bg-white rounded-card border border-line px-5 py-8 md:px-8 md:py-10">
        <AuthForm titleAs="h1" onDone={() => router.push("/my")} />
      </div>
    </div>
  );
}
