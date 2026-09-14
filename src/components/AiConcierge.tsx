"use client";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { usePathname } from "next/navigation";

type Message = { role: "user" | "assistant"; text: string };

// admin/auth/checkout screens don't need the customer-facing chat launcher
const HIDDEN = ["/admin", "/auth", "/pay", "/quote", "/q"];

const WELCOME = "היי! אני העוזר החכם שלכם לחופשת סקי בואל טורנס 🎿\nספרו לי כמה אתם ובאילו תאריכים, ואני אמצא לכם דירה, סקי פס, הסעה וציוד — הכל במקום אחד.";

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || "";
      resolve({ base64, mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AiConcierge() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: WELCOME }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null);
  const dragStartY = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  // The iOS App Store build loads this site inside a Capacitor WKWebView
  // (contentInset: "always" — see capacitor.config.ts), where a background
  // page that's still scrollable behind a `fixed` overlay can rubber-band
  // and detach the overlay from the viewport, looking like the screen
  // "tears"/blows up. Lock body scroll while the panel is open.
  useEffect(() => {
    if (!open) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [open]);

  // `dvh` alone isn't enough: on-screen-keyboard resize is reported
  // differently across mobile browsers/WebViews, and a `fixed` element sized
  // off the wrong viewport can end up pinned above/behind the keyboard,
  // looking like the whole chat "disappeared". Track the real visible area
  // via visualViewport and size the sheet off that directly.
  useEffect(() => {
    if (!open) return;
    // Desktop has its own fixed-size card (md:h-[560px]) and no on-screen
    // keyboard to dodge — don't let this override that layout.
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) return;
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    const update = () => setViewport({ height: vv.height, top: vv.offsetTop });
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setViewport(null);
    };
  }, [open]);

  const hidden = HIDDEN.some(h => pathname === h || pathname.startsWith(h + "/"));

  // Mobile bottom-sheet drag handle — swipe down to close, like a native
  // sheet. Only wired on the handle bar so it never fights the message
  // list's own vertical scroll.
  const onHandlePointerDown = (e: ReactPointerEvent) => {
    setDragging(true);
    dragStartY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onHandlePointerMove = (e: ReactPointerEvent) => {
    if (!dragging) return;
    setDragY(Math.max(0, e.clientY - dragStartY.current));
  };
  const onHandlePointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (dragY > 90) setOpen(false);
    setDragY(0);
  };

  const send = async () => {
    const text = input.trim();
    if (!text && !pendingImage) return;
    const userMsg: Message = { role: "user", text: text || "(שלח/ה תמונה)" };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    let image: { base64: string; mimeType: string } | undefined;
    if (pendingImage) {
      image = await fileToBase64(pendingImage.file);
      setPendingImage(null);
    }

    try {
      const res = await fetch("/api/ai-concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, image }),
      });
      const j = await res.json();
      setMessages(m => [...m, { role: "assistant", text: j.reply || "משהו השתבש, נסו שוב." }]);
    } catch {
      setMessages(m => [...m, { role: "assistant", text: "משהו השתבש, נסו שוב בעוד רגע." }]);
    } finally {
      setSending(false);
    }
  };

  if (hidden) return null;

  return (
    <>
      {/* Launcher — raised circular avatar, docked in the middle of the mobile
          tab bar; floats bottom-corner on desktop where there's no tab bar. */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="עוזר חכם לחופשת סקי"
        className="fixed z-[60] rounded-full shadow-lg border-2 border-white overflow-hidden
          bottom-[34px] left-1/2 -translate-x-1/2 w-16 h-16
          md:bottom-6 md:left-6 md:right-auto md:translate-x-0 md:w-16 md:h-16
          bg-blue-600 transition-transform hover:scale-105 active:scale-95"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ai-guide.png" alt="" className="w-full h-full object-cover object-top" />
        <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 border-2 border-white">AI</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center md:justify-start bg-black/30 overscroll-none"
          style={viewport ? { top: viewport.top, height: viewport.height } : undefined}
          onClick={() => setOpen(false)}>
          <div dir="rtl" onClick={e => e.stopPropagation()}
            style={{
              transform: `translateY(${dragY}px)`,
              transition: dragging ? "none" : "transform 200ms ease-out",
              ...(viewport ? { height: Math.min(viewport.height * 0.85, viewport.height - 24) } : {}),
            }}
            className="bg-white w-full md:w-[380px] md:mb-24 md:ms-6 h-[85dvh] max-h-[92dvh] md:h-[560px] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden overscroll-contain">
            {/* drag handle — mobile-only swipe-down-to-close affordance */}
            <div className="md:hidden pt-2 pb-1 flex justify-center touch-none cursor-grab active:cursor-grabbing"
              onPointerDown={onHandlePointerDown} onPointerMove={onHandlePointerMove} onPointerUp={onHandlePointerUp} onPointerCancel={onHandlePointerUp}>
              <div className="w-10 h-1.5 rounded-full bg-gray-300" />
            </div>

            {/* header */}
            <div className="flex items-center gap-3 px-4 pb-4 pt-1 md:pt-4 border-b border-gray-100 bg-blue-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ai-guide.png" alt="" className="w-10 h-10 rounded-full object-cover object-top border-2 border-white shadow" />
              <div className="flex-1 min-w-0">
                <div className="font-black text-gray-900 text-sm">עוזר החופשה החכם</div>
                <div className="text-xs text-gray-500">מחפש דירה, סקי פס, הסעה וציוד — הכל בבת אחת</div>
              </div>
              <button onClick={() => { setMessages([{ role: "assistant", text: WELCOME }]); setInput(""); setPendingImage(null); }}
                title="להתחיל שיחה חדשה" aria-label="להתחיל שיחה חדשה"
                className="text-gray-400 hover:text-gray-600 active:scale-90 transition-transform text-lg leading-none w-9 h-9 flex items-center justify-center -mr-1">↺</button>
              <button onClick={() => setOpen(false)} aria-label="סגירה"
                className="text-gray-400 hover:text-gray-600 active:scale-90 transition-transform text-xl leading-none w-9 h-9 flex items-center justify-center">✕</button>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed whitespace-pre-line ${
                    m.role === "user" ? "bg-gray-100 text-gray-800" : "bg-blue-600 text-white"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white rounded-2xl px-3.5 py-2.5 text-sm">
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce [animation-delay:-.3s]" />
                      <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce [animation-delay:-.15s]" />
                      <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-bounce" />
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* input — extra bottom padding clears the home-indicator area on notched phones */}
            <div className="p-3 border-t border-gray-100" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
              {pendingImage && (
                <div className="flex items-center gap-2 mb-2 bg-blue-50 rounded-xl p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pendingImage.preview} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <span className="text-xs text-blue-700 flex-1">צילום מסך טיסה מוכן לשליחה</span>
                  <button onClick={() => setPendingImage(null)} className="text-xs text-red-500 font-bold p-1">✕</button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setPendingImage({ file, preview: URL.createObjectURL(file) });
                  }} />
                <button onClick={() => fileRef.current?.click()} aria-label="צרפו צילום מסך"
                  className="flex-shrink-0 w-11 h-11 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 active:scale-90 transition-transform flex items-center justify-center text-lg">📷</button>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !sending) send(); }}
                  placeholder="למשל: 4 אנשים, 8-15 בפברואר"
                  className="flex-1 border border-gray-200 rounded-full px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={send} disabled={sending || (!input.trim() && !pendingImage)} aria-label="שליחה"
                  className="flex-shrink-0 w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-90 disabled:active:scale-100 transition-transform disabled:opacity-40 text-white flex items-center justify-center">
                  ←
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
