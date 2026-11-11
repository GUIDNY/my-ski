/*
 * Open a PayPlus payment page inside the site (a window over the page, PayPlus in an
 * iframe) instead of sending the customer away. components/PayFrame listens for it;
 * without it (or if anything fails) the browser just goes to the page as before.
 * When PayPlus is done it loads our /pay/success|failure inside the frame, and
 * components/PayBreakOut moves that to the whole window.
 */
export const PAY_EVENT = "skishare:pay";

export function openPayment(url: string) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __skisharePayFrame?: boolean };
  if (!w.__skisharePayFrame || !/^https:\/\/[\w.-]*payplus\.co\.il\//.test(url)) { window.location.assign(url); return; }
  window.dispatchEvent(new CustomEvent(PAY_EVENT, { detail: url }));
}
