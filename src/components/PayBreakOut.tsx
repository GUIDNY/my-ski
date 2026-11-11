"use client";
import { useEffect } from "react";

/* PayPlus finished inside the payment window: show our result page in the whole window */
export default function PayBreakOut() {
  useEffect(() => {
    try { if (window.self !== window.top && window.top) window.top.location.replace(window.location.href); } catch { /* not ours to move */ }
  }, []);
  return null;
}
