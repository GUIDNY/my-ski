"use client";
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { usePathname } from "next/navigation";
import { helperWaHref, OPEN_CHAT_EVENT } from "@/lib/helper-whatsapp";

// One chat message. The helper answers in a few short messages, then the quote
// link and apartment photos (when it made a quote or showed an apartment).
type Message = { role: "user" | "assistant"; text: string; link?: string; images?: string[] };

type Answer = {
  ok?: boolean;
  bubbles?: string[];
  link?: string | null;
  images?: string[];
  contact?: string | null;
  reply?: string; // the old site bot (fallback) answers in one message
};

// admin/auth/checkout screens don't need the customer-facing chat launcher
const HIDDEN = ["/admin", "/auth", "/pay", "/quote", "/q"];

const WELCOME: Message[] = [
  { role: "assistant", text: "היי, כאן SkiShare" },
  { role: "assistant", text: "תכתבו כמה אתם ולאיזה תאריכים, ונכין לכם הצעה מלאה עם דירה, סקי פס, הסעה וציוד" },
];

// The same helper answers on WhatsApp, so the chat can carry on there.
const WA_HREF = helperWaHref();

const STORE = "skishare-chat-v2";

function newSessionId(): string {
  try {
    return crypto.randomUUID().replace(/-/g, "");
  } catch {
    return (Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).slice(0, 40);
  }
}

// The reply text is plain text rendered with whitespace-pre-line — a bare URL
// in there isn't a link on its own, so split it out and render it as one.
function linkify(text: string, onBlueBg: boolean) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer"
        className={onBlueBg ? "underline text-white font-semibold break-all" : "underline text-accent font-semibold break-all"}>
        {part}
      </a>
    ) : (
      part
    )
  );
}

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ base64: result.split(",")[1] || "", mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Phone photos are several MB; a 1600px JPEG is plenty to read a flight
// screenshot and keeps the request small.
async function shrinkImage(file: File): Promise<{ base64: string; mimeType: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { base64: canvas.toDataURL("image/jpeg", 0.82).split(",")[1] || "", mimeType: "image/jpeg" };
  } catch {
    return fileToBase64(file);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
// "typing…" between messages for about as long as a quick thumb would take
const typingMs = (text: string) => Math.min(2600, Math.max(900, 700 + 28 * text.length)) * (0.85 + Math.random() * 0.3);

export default function AiConcierge() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(WELCOME);
  const [sessionId, setSessionId] = useState("");
  const [contact, setContact] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);        // waiting for the answer or still showing it
  const [typing, setTyping] = useState(false);
  const [waiting, setWaiting] = useState(false);  // the request is out, no answer yet
  const [waitSecs, setWaitSecs] = useState(0);
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null);
  const dragStartY = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const restored = useRef(false);

  // Keep the conversation across page changes and reloads in this tab:
  // picked up again the first time the chat is opened.
  const restore = () => {
    if (restored.current) return;
    restored.current = true;
    let saved: { sessionId?: string; messages?: Message[]; contact?: string } | null = null;
    try { saved = JSON.parse(sessionStorage.getItem(STORE) || "null"); } catch { saved = null; }
    if (saved?.sessionId && Array.isArray(saved.messages) && saved.messages.length) {
      setSessionId(saved.sessionId);
      setMessages(saved.messages.slice(-60));
      setContact(saved.contact || "");
    } else {
      setSessionId(newSessionId());
    }
  };
  // "Write to our assistant" buttons elsewhere on the page open the chat
  useEffect(() => {
    const onOpen = () => { restore(); setOpen(true); };
    window.addEventListener(OPEN_CHAT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen);
  }, []);
  useEffect(() => {
    if (!restored.current || !sessionId) return;
    try { sessionStorage.setItem(STORE, JSON.stringify({ sessionId, messages: messages.slice(-60), contact })); } catch { /* private mode */ }
  }, [sessionId, messages, contact]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, typing, waitSecs]);

  // seconds spent waiting for the answer, for the small status line under "typing…"
  useEffect(() => {
    if (!waiting) return;
    const started = Date.now();
    const t = setInterval(() => setWaitSecs(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(t);
  }, [waiting]);

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

  const restart = () => {
    if (busy) return;
    setMessages(WELCOME);
    setSessionId(newSessionId());
    setContact("");
    setInput("");
    setPendingImage(null);
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && !pendingImage) || busy) return;
    const userMsg: Message = { role: "user", text: text || "(שלחתי תמונה)" };
    const transcript = [...messages, userMsg];
    setMessages(transcript);
    setInput("");
    setBusy(true);
    setTyping(true);
    setWaitSecs(0);
    setWaiting(true);

    let image: { base64: string; mimeType: string } | undefined;
    if (pendingImage) {
      image = await shrinkImage(pendingImage.file);
      setPendingImage(null);
    }

    let answer: Answer | null = null;
    try {
      const res = await fetch("/api/ai-concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId, message: text, contact, image,
          // only used by the old site bot, if the helper can't answer
          messages: transcript
            .filter(m => m.text && !(m.role === "assistant" && WELCOME.some(w => w.text === m.text)))
            .map(m => ({ role: m.role, text: m.text })).slice(-20),
        }),
      });
      answer = await res.json();
    } catch {
      answer = null;
    }
    setWaiting(false);

    const items: Message[] = [];
    if (answer?.bubbles?.length) {
      for (const b of answer.bubbles) items.push({ role: "assistant", text: b });
      if (answer.link) items.push({ role: "assistant", text: "", link: answer.link });
      if (answer.images?.length) items.push({ role: "assistant", text: "", images: answer.images });
      if (answer.contact) setContact(answer.contact);
    } else {
      items.push({ role: "assistant", text: answer?.reply || "משהו השתבש אצלנו, אפשר לנסות שוב עוד רגע" });
    }

    // like WhatsApp: the first message right away (the wait already looked
    // like typing), then "typing…" before each next one
    for (let i = 0; i < items.length; i++) {
      if (i > 0) {
        setTyping(true);
        await sleep(items[i].text ? typingMs(items[i].text) : 700);
      }
      setTyping(false);
      setMessages(m => [...m, items[i]]);
    }
    setTyping(false);
    setBusy(false);
  };

  if (hidden) return null;

  const status = !waiting ? "" : waitSecs >= 35 ? "עוד רגע, מכינים את ההצעה…" : waitSecs >= 12 ? "בודקים זמינות ומחירים…" : "";

  return (
    <>
      {/* Launcher: desktop only, bottom corner. On phones the chat opens from
          the header's chat button and the "write to us" buttons on the page. */}
      <button
        onClick={() => { restore(); setOpen(v => !v); }}
        aria-label="צ'אט עם SkiShare"
        className="hidden md:block fixed z-[60] bottom-6 left-6 w-[60px] h-[60px] rounded-full border-[3px] border-white bg-soft-2 overflow-visible transition-transform hover:scale-105 active:scale-95"
        style={{ boxShadow: "0 10px 28px rgba(11,27,51,0.28)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/helper.jpg" alt="" className="w-full h-full rounded-full object-cover" />
        <span className="absolute -top-1 -right-1 bg-ok text-white text-[10px] font-extrabold rounded-full px-1.5 py-0.5 border-2 border-white leading-none">AI</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end md:block bg-ink/35 md:bg-ink/20 overscroll-none"
          style={viewport ? { top: viewport.top, height: viewport.height, transition: "height 200ms ease-out, top 200ms ease-out" } : undefined}
          onClick={() => setOpen(false)}>
          <div dir="rtl" onClick={e => e.stopPropagation()} role="dialog" aria-label="צ'אט עם SkiShare"
            style={{
              transform: `translateY(${dragY}px)`,
              transition: dragging ? "none" : "transform 200ms ease-out, height 200ms ease-out",
              ...(viewport ? { height: Math.min(viewport.height * 0.88, viewport.height - 16) } : {}),
            }}
            className="bg-white w-full h-[88dvh] max-h-[94dvh] rounded-t-[24px] flex flex-col overflow-hidden overscroll-contain
              md:absolute md:left-6 md:bottom-[100px] md:w-[400px] md:h-[600px] md:max-h-[calc(100dvh-130px)] md:rounded-card md:border md:border-line"
            >
            {/* drag handle — mobile-only swipe-down-to-close affordance */}
            <div className="md:hidden pt-2.5 pb-1 flex justify-center touch-none cursor-grab active:cursor-grabbing"
              onPointerDown={onHandlePointerDown} onPointerMove={onHandlePointerMove} onPointerUp={onHandlePointerUp} onPointerCancel={onHandlePointerUp}>
              <div className="w-10 h-1.5 rounded-full bg-line-strong" />
            </div>

            {/* header */}
            <div className="flex items-center gap-3 px-4 pb-3.5 pt-1.5 md:pt-4 border-b border-line">
              <span className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/helper.jpg" alt="" className="w-11 h-11 rounded-full object-cover" />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-ok border-2 border-white" aria-hidden="true" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-ink text-[17px] flex items-center gap-1.5">
                  SkiShare
                  <span className="bg-ok-soft text-ok-text text-[11px] font-extrabold rounded-full px-1.5 py-0.5 leading-none">AI</span>
                </div>
                <div className="text-[13px] text-muted truncate">עוזר דיגיטלי · עונה בעברית, גם בוואטסאפ</div>
              </div>
              <a href={WA_HREF} target="_blank" rel="noopener noreferrer" title="להמשיך בוואטסאפ" aria-label="להמשיך בוואטסאפ"
                className="w-10 h-10 flex items-center justify-center rounded-full text-[#128C4B] hover:bg-ok-soft transition-colors">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
                </svg>
              </a>
              <button onClick={restart} disabled={busy}
                title="להתחיל שיחה חדשה" aria-label="להתחיל שיחה חדשה"
                className="w-10 h-10 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-soft transition-colors disabled:opacity-40">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
              </button>
              <button onClick={() => setOpen(false)} aria-label="סגירה"
                className="w-10 h-10 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-soft transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>

            {/* messages */}
            <div ref={scrollRef} aria-live="polite" className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-white">
              {messages.map((m, i) => {
                const mine = m.role === "user";
                const row = `flex ${mine ? "justify-start" : "justify-end"}`;
                if (m.link) return (
                  <div key={i} className={row}>
                    <a href={m.link} target="_blank" rel="noopener noreferrer"
                      className="max-w-[85%] flex items-center gap-3 rounded-2xl border border-line bg-white px-3.5 py-3 hover:border-accent transition-colors">
                      <span className="w-10 h-10 shrink-0 rounded-xl bg-danger-soft text-danger text-[11px] font-extrabold flex items-center justify-center">PDF</span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-bold text-ink">הצעת המחיר שלכם</span>
                        <span className="block text-[13px] text-muted">כל הפרטים וקישורי תשלום · לפתיחה</span>
                      </span>
                    </a>
                  </div>
                );
                if (m.images?.length) return (
                  <div key={i} className={row}>
                    <div className="max-w-[85%] grid grid-cols-2 gap-1.5">
                      {m.images.map((src, j) => (
                        <a key={j} href={src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl bg-soft">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="" loading="lazy" className="w-full h-24 object-cover hover:scale-105 transition-transform" />
                        </a>
                      ))}
                    </div>
                  </div>
                );
                return (
                  <div key={i} className={row}>
                    <div className={`max-w-[85%] rounded-[18px] px-3.5 py-2.5 text-[15px] leading-relaxed whitespace-pre-line ${
                      mine ? "bg-accent text-white" : "bg-soft text-ink"
                    }`}>
                      {linkify(m.text, mine)}
                    </div>
                  </div>
                );
              })}
              {typing && (
                <div className="flex flex-col items-end gap-1">
                  <div className="bg-soft rounded-[18px] px-4 py-3" aria-label="מקליד">
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 bg-muted/70 rounded-full animate-bounce [animation-delay:-.3s]" />
                      <span className="w-1.5 h-1.5 bg-muted/70 rounded-full animate-bounce [animation-delay:-.15s]" />
                      <span className="w-1.5 h-1.5 bg-muted/70 rounded-full animate-bounce" />
                    </span>
                  </div>
                  {status && <div className="text-[12px] text-muted">{status}</div>}
                </div>
              )}
            </div>

            {/* input — extra bottom padding clears the home-indicator area on notched phones */}
            <div className="px-3 pt-3 border-t border-line bg-white" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
              {pendingImage && (
                <div className="flex items-center gap-2 mb-2 bg-soft rounded-xl p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pendingImage.preview} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <span className="text-[13px] text-ink flex-1">התמונה מוכנה לשליחה</span>
                  <button onClick={() => setPendingImage(null)} aria-label="להסיר את התמונה" className="w-9 h-9 flex items-center justify-center text-danger font-bold">✕</button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setPendingImage({ file, preview: URL.createObjectURL(file) });
                    e.target.value = "";
                  }} />
                <button onClick={() => fileRef.current?.click()} aria-label="לצרף תמונה"
                  className="shrink-0 w-11 h-11 rounded-full border border-line-strong text-muted hover:text-ink hover:border-ink transition-colors flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.5" /></svg>
                </button>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !busy) send(); }}
                  placeholder="למשל: 4 אנשים, 8-15 בפברואר"
                  aria-label="ההודעה שלכם"
                  maxLength={1500}
                  className="flex-1 min-w-0 border border-line-strong rounded-full px-4 py-3 text-base text-ink placeholder:text-muted/70 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <button onClick={send} disabled={busy || (!input.trim() && !pendingImage)} aria-label="שליחה"
                  className="shrink-0 w-11 h-11 rounded-full bg-accent hover:bg-accent-hover transition-colors disabled:opacity-40 text-white flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
