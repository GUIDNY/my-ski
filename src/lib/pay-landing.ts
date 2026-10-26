import { createHmac, timingSafeEqual } from "crypto";

/*
 * A payment link the bot makes for any amount opens a page on the site first
 * (/pay/go), where the customer approves the terms (a checkbox) before the
 * PayPlus page. The page's address carries the PayPlus link, the amount and
 * what it is for, signed so nobody can change them. No personal details.
 */

export type Landing = { u: string; a: number; c: "EUR" | "ILS"; t: string };

const key = () => process.env.PAYPLUS_SECRET_KEY || "";
const sign = (d: string) => createHmac("sha256", key()).update(`pay-landing:${d}`).digest("base64url");

export function landingUrl(origin: string, l: Landing): string {
  const d = Buffer.from(JSON.stringify(l)).toString("base64url");
  return `${origin}/pay/go?d=${d}&s=${sign(d)}`;
}

export function readLanding(d?: string, s?: string): Landing | null {
  if (!d || !s || !key()) return null;
  const want = Buffer.from(sign(d)), got = Buffer.from(s);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const l = JSON.parse(Buffer.from(d, "base64url").toString()) as Landing;
    const host = new URL(l.u).hostname;
    if (new URL(l.u).protocol !== "https:" || !(host === "payplus.co.il" || host.endsWith(".payplus.co.il"))) return null;
    return Number(l.a) > 0 ? l : null;
  } catch { return null; }
}
