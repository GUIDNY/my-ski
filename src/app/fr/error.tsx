"use client";
import IntlError from "@/components/intl/IntlError";

export default function Error({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return <IntlError lang="fr" retry={unstable_retry} />;
}
