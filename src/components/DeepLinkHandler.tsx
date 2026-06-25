"use client";
import { useEffect } from "react";

// Inside the native app only: when the app is opened via the custom URL scheme
// (skishare://open?path=/q/...), navigate the webview to that page on the live site.
export default function DeepLinkHandler() {
  useEffect(() => {
    let remove: (() => void) | undefined;
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor?.isNativePlatform?.()) return;
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
              window.location.href = "https://skisharebook.com" + path;
            }
          } catch { /* ignore malformed urls */ }
        });
        remove = () => handle.remove();
      } catch { /* @capacitor/app missing on web build — ignore */ }
    })();
    return () => { remove?.(); };
  }, []);

  return null;
}
