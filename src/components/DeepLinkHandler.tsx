"use client";
import { useEffect } from "react";

const SITE = "https://skisharebook.com";

// Inside the native app only:
// 1. When the app is opened via the custom URL scheme (skishare://open?path=/q/...)
//    or a universal link, navigate the webview to that page on the live site.
// 2. Links to our own site that would open a new window (target="_blank", e.g.
//    "open the quote") stay inside the app. A new window in the app means
//    Safari, where the person is then asked to open the app again.
export default function DeepLinkHandler() {
  useEffect(() => {
    let remove: (() => void) | undefined;
    let onClick: ((e: MouseEvent) => void) | undefined;
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor?.isNativePlatform?.()) return;

        onClick = (e: MouseEvent) => {
          if (e.defaultPrevented || e.button !== 0) return;
          const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
          if (!a || a.target !== "_blank" || a.hasAttribute("download")) return;
          let url: URL;
          try { url = new URL(a.href, window.location.href); } catch { return; }
          const ours = url.origin === window.location.origin || url.origin === SITE;
          if (!ours || /^\/api\//.test(url.pathname)) return;
          e.preventDefault();
          window.location.href = window.location.origin + url.pathname + url.search + url.hash;
        };
        document.addEventListener("click", onClick, true);

        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appUrlOpen", ({ url }) => {
          try {
            // skishare://open?path=%2Fq%2F... OR universal link https://skisharebook.com/q/...
            let path = "";
            if (url.startsWith("skishare://")) {
              const u = new URL(url);
              path = u.searchParams.get("path") || "/";
            } else {
              const u = new URL(url);
              path = u.pathname + u.search;
            }
            if (path && path !== window.location.pathname + window.location.search) {
              window.location.href = SITE + path;
            }
          } catch { /* ignore malformed urls */ }
        });
        remove = () => handle.remove();
      } catch { /* @capacitor/app missing on web build — ignore */ }
    })();
    return () => {
      remove?.();
      if (onClick) document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}
