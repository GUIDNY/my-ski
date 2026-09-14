"use client";
import { useEffect, useRef, useState } from "react";
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
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const hidden = HIDDEN.some(h => pathname === h || pathname.startsWith(h + "/"));

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
          bg-blue-600 transition-transform hover:scale-105"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ai-guide.png" alt="" className="w-full h-full object-cover object-top" />
        <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 border-2 border-white">AI</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center md:justify-start bg-black/30" onClick={() => setOpen(false)}>
          <div dir="rtl" onClick={e => e.stopPropagation()}
            className="bg-white w-full md:w-[380px] md:mb-24 md:ms-6 h-[85vh] md:h-[560px] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-blue-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ai-guide.png" alt="" className="w-10 h-10 rounded-full object-cover object-top border-2 border-white shadow" />
              <div className="flex-1 min-w-0">
                <div className="font-black text-gray-900 text-sm">עוזר החופשה החכם</div>
                <div className="text-xs text-gray-500">מחפש דירה, סקי פס, הסעה וציוד — הכל בבת אחת</div>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none px-1">✕</button>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line ${
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

            {/* input */}
            <div className="p-3 border-t border-gray-100">
              {pendingImage && (
                <div className="flex items-center gap-2 mb-2 bg-blue-50 rounded-xl p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pendingImage.preview} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <span className="text-xs text-blue-700 flex-1">צילום מסך טיסה מוכן לשליחה</span>
                  <button onClick={() => setPendingImage(null)} className="text-xs text-red-500 font-bold">✕</button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setPendingImage({ file, preview: URL.createObjectURL(file) });
                  }} />
                <button onClick={() => fileRef.current?.click()}
                  className="flex-shrink-0 w-10 h-10 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center text-lg">📷</button>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !sending) send(); }}
                  placeholder="למשל: 4 אנשים, 8-15 בפברואר"
                  className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={send} disabled={sending || (!input.trim() && !pendingImage)}
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center">
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
