import Link from "next/link";
import OpenChatButton from "@/components/OpenChatButton";
import { btn } from "@/components/ui";
import { StatusCard } from "@/components/checkout/Checkout";
import { helperWaHref } from "@/lib/helper-whatsapp";

export default function PayFailure() {
  return (
    <StatusCard tone="danger" title="התשלום לא הושלם"
      actions={<>
        <a href={helperWaHref("היי, ניסיתי לשלם באתר והתשלום לא הושלם")} target="_blank" rel="noopener noreferrer" className={btn.primary}>
          לכתוב לנו בוואטסאפ
        </a>
        <Link href="/" className={btn.outline}>חזרה לאתר</Link>
      </>}>
      <p className="text-[16px] md:text-[17px] leading-relaxed text-body max-w-[460px]">
        משהו השתבש או שהתשלום בוטל. אפשר לנסות שוב, או לדבר איתנו ונשמח לעזור לסגור את ההזמנה.
      </p>
      <p className="text-[14px] text-muted">
        אפשר גם <OpenChatButton className="font-bold text-accent hover:text-accent-hover">לכתוב לעוזר שלנו בצ&apos;אט</OpenChatButton>
      </p>
    </StatusCard>
  );
}
