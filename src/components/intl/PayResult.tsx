"use client";
import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { btn, chip } from "@/components/ui";
import { StatusCard } from "@/components/checkout/Checkout";
import { CONTACT_EMAIL, LAST_APARTMENT_KEY, type Lang } from "@/lib/intl/config";
import { DICT } from "@/lib/intl/dict";

/*
 * Where PayPlus sends the customer back (create-link with lang "en"/"fr").
 * Success confirms the payment exactly like src/app/pay/success/page.tsx:
 * the transaction / payment page ids go to /api/payplus/confirm, which
 * checks them with PayPlus before anything is marked as paid.
 */

export function PaySuccess({ lang }: { lang: Lang }) {
  const t = DICT[lang].pay;
  const params = useSearchParams();
  const order = params.get("order");
  const transactionUid = params.get("transaction_uid") || params.get("transactionUid") || "";
  const pageRequestUid = params.get("page_request_uid") || params.get("payment_request_uid") || params.get("pageRequestUid") || "";

  useEffect(() => {
    if (!order) return;
    fetch("/api/payplus/confirm", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_code: order, transaction_uid: transactionUid, page_request_uid: pageRequestUid }),
    }).catch(() => {});
  }, [order, transactionUid, pageRequestUid]);

  return (
    <StatusCard tone="ok" title={t.successTitle}
      actions={<>
        <Link href={`/${lang}`} className={btn.primary}>{t.backHome}</Link>
        <Link href={`/${lang}/apartments`} className={btn.outline}>{t.seeApts}</Link>
      </>}>
      {order && <span className={chip}>{t.code} <b className="font-bold tracking-wide">{order.toUpperCase()}</b></span>}
      <p className="text-[16px] md:text-[17px] leading-relaxed text-body max-w-[480px]">{t.successText}</p>
      <div className="w-full text-start bg-soft border border-line rounded-2xl p-4 md:p-5">
        <div className="font-bold text-[16px] text-ink mb-3">{t.nextTitle}</div>
        <ol className="flex flex-col gap-2.5">
          {t.next.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-[15px] text-body leading-relaxed">
              <span className="shrink-0 w-6 h-6 rounded-full bg-white border border-line text-ink text-[13px] font-bold flex items-center justify-center" aria-hidden="true">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="text-[14px] text-muted">
        {t.questions} <a href={`mailto:${CONTACT_EMAIL}${order ? `?subject=${encodeURIComponent(order.toUpperCase())}` : ""}`} className="font-bold text-accent hover:text-accent-hover wrap-anywhere">{CONTACT_EMAIL}</a>
      </p>
    </StatusCard>
  );
}

// the apartment page the customer left for PayPlus (sessionStorage, this tab only)
const noop = () => () => {};
const readLast = () => { try { return sessionStorage.getItem(LAST_APARTMENT_KEY); } catch { return null; } };

export function PayFailure({ lang }: { lang: Lang }) {
  const t = DICT[lang].pay;
  const last = useSyncExternalStore(noop, readLast, () => null);
  const back = last && last.startsWith(`/${lang}/apartments/`) ? last : null;
  return (
    <StatusCard tone="danger" title={t.failTitle}
      actions={<>
        <Link href={back ?? `/${lang}/apartments`} className={btn.primary}>{back ? t.backToApt : t.backToApts}</Link>
        <a href={`mailto:${CONTACT_EMAIL}`} className={btn.outline}>{t.emailUs}</a>
      </>}>
      <p className="text-[16px] md:text-[17px] leading-relaxed text-body max-w-[460px]">{t.failText}</p>
      <p className="text-[14px] text-muted wrap-anywhere">{CONTACT_EMAIL}</p>
    </StatusCard>
  );
}
