"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { buildWaHref } from "@/lib/whatsapp";

/* ── Config ─────────────────────────────────────────────── */
const W = 400, H = 640;
const LANES = 3;
const PLAYER_Y = H - 96;
const COIN_KEY = "skishare_coins";

const laneX = (i: number) => (W * (i + 0.5)) / LANES;

type Entity = { lane: number; y: number; type: "coin" | "tree" | "rock"; r: number };

const SHOP = [
  { id: "socks", name: "גרבי SkiShare", cost: 1500, icon: "🧦", desc: "גרביים חמים לעונה" },
  { id: "mug",   name: "מאג SkiShare",  cost: 2500, icon: "☕", desc: "כוס תרמית ממותגת" },
  { id: "beanie",name: "כובע גרב",      cost: 3000, icon: "🧢", desc: "כובע SkiShare" },
  { id: "party", name: "כניסה חינם למסיבה", cost: 4000, icon: "🎟️", desc: "כרטיס לאירוע הקהילה" },
];

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wallet, setWallet] = useState(0);
  const [runCoins, setRunCoins] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [showShop, setShowShop] = useState(false);
  const [redeemed, setRedeemed] = useState<{ name: string; code: string } | null>(null);

  // mutable game state (kept in refs so the loop doesn't trigger re-renders)
  const g = useRef({
    lane: 1, px: laneX(1), entities: [] as Entity[],
    speed: 180, spawnT: 0, dist: 0, coins: 0, raf: 0, last: 0, running: false,
  });

  /* load wallet */
  useEffect(() => {
    const v = Number(localStorage.getItem(COIN_KEY) || 0);
    setWallet(Number.isFinite(v) ? v : 0);
  }, []);

  const saveWallet = (v: number) => { setWallet(v); localStorage.setItem(COIN_KEY, String(v)); };

  const move = useCallback((dir: -1 | 1) => {
    const s = g.current;
    if (!s.running) return;
    s.lane = Math.max(0, Math.min(LANES - 1, s.lane + dir));
  }, []);

  /* keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") move(-1);   // RTL-agnostic: left arrow = lane left
      if (e.key === "ArrowRight" || e.key === "d") move(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  const endGame = useCallback(() => {
    const s = g.current;
    s.running = false;
    cancelAnimationFrame(s.raf);
    setPhase("over");
    setWallet(prev => {
      const next = prev + s.coins;
      localStorage.setItem(COIN_KEY, String(next));
      return next;
    });
  }, []);

  const loop = useCallback((t: number) => {
    const s = g.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dt = Math.min(0.05, (t - s.last) / 1000 || 0);
    s.last = t;

    // update
    s.speed += dt * 8;                 // gradual difficulty
    s.dist += s.speed * dt;
    s.px += (laneX(s.lane) - s.px) * Math.min(1, dt * 14); // smooth lane glide

    s.spawnT -= dt;
    if (s.spawnT <= 0) {
      s.spawnT = Math.max(0.45, 0.95 - s.dist / 9000);
      const lane = Math.floor(Math.random() * LANES);
      const isCoin = Math.random() < 0.62;
      s.entities.push({ lane, y: -40, type: isCoin ? "coin" : (Math.random() < 0.5 ? "tree" : "rock"), r: isCoin ? 13 : 20 });
    }

    for (const e of s.entities) e.y += s.speed * dt;

    // collisions
    const hitBand = 34;
    for (const e of s.entities) {
      if (Math.abs(e.y - PLAYER_Y) < hitBand && e.lane === s.lane && !(e as Entity & {done?:boolean}).done) {
        if (e.type === "coin") {
          (e as Entity & {done?:boolean}).done = true;
          s.coins += 1;
          setRunCoins(s.coins);
        } else {
          endGame();
          return;
        }
      }
    }
    s.entities = s.entities.filter(e => e.y < H + 40 && !(e as Entity & {done?:boolean}).done);

    setScore(Math.floor(s.dist / 10));

    /* ── draw ── */
    ctx.clearRect(0, 0, W, H);
    // slope background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#dbeafe"); grad.addColorStop(1, "#f8fafc");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    // lane dividers (moving dashes for speed feel)
    ctx.strokeStyle = "rgba(148,163,184,0.35)"; ctx.lineWidth = 3; ctx.setLineDash([18, 22]);
    const off = (s.dist % 40);
    for (let i = 1; i < LANES; i++) {
      ctx.beginPath(); ctx.lineDashOffset = -off;
      ctx.moveTo((W * i) / LANES, 0); ctx.lineTo((W * i) / LANES, H); ctx.stroke();
    }
    ctx.setLineDash([]);

    // entities
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const e of s.entities) {
      if (e.type === "coin") {
        ctx.font = "26px serif"; ctx.fillText("🪙", laneX(e.lane), e.y);
      } else {
        ctx.font = "34px serif"; ctx.fillText(e.type === "tree" ? "🌲" : "🪨", laneX(e.lane), e.y);
      }
    }
    // player
    ctx.font = "40px serif"; ctx.fillText("⛷️", s.px, PLAYER_Y);

    s.raf = requestAnimationFrame(loop);
  }, [endGame]);

  const start = useCallback(() => {
    const s = g.current;
    s.lane = 1; s.px = laneX(1); s.entities = []; s.speed = 180; s.spawnT = 0;
    s.dist = 0; s.coins = 0; s.last = performance.now(); s.running = true;
    setRunCoins(0); setScore(0); setPhase("playing");
    cancelAnimationFrame(s.raf);
    s.raf = requestAnimationFrame(loop);
  }, [loop]);

  useEffect(() => () => cancelAnimationFrame(g.current.raf), []);

  /* HiDPI crispness */
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr; c.height = H * dpr;
    c.getContext("2d")!.scale(dpr, dpr);
  }, []);

  const redeem = (item: typeof SHOP[number]) => {
    if (wallet < item.cost) return;
    saveWallet(wallet - item.cost);
    const code = "SKI-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    setRedeemed({ name: item.name, code });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center" dir="rtl">
      {/* Top bar */}
      <div className="w-full max-w-md flex items-center justify-between px-4 py-3">
        <a href="/seasonaires" className="text-white/60 hover:text-white text-sm transition">→ חזרה</a>
        <img src="/skishare-logo.png" alt="SkiShare" className="h-8 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
        <button onClick={() => { setShowShop(true); setRedeemed(null); }}
          className="flex items-center gap-1.5 bg-amber-400 text-slate-900 font-black text-sm px-3 py-1.5 rounded-full">
          🪙 {wallet.toLocaleString()}
        </button>
      </div>

      <h1 className="font-display text-2xl font-black mt-1 mb-3">סקישר ראן 🎿</h1>

      {/* Game area */}
      <div className="relative w-full max-w-[400px] aspect-[400/640] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

        {/* HUD */}
        {phase === "playing" && (
          <div className="absolute top-3 inset-x-3 flex items-center justify-between text-slate-900 font-black">
            <span className="bg-white/80 rounded-full px-3 py-1 text-sm">🪙 {runCoins}</span>
            <span className="bg-white/80 rounded-full px-3 py-1 text-sm">{score} מ׳</span>
          </div>
        )}

        {/* Start screen */}
        {phase === "idle" && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center px-6">
            <div className="text-6xl mb-4">⛷️</div>
            <h2 className="font-display text-2xl font-black mb-2">מוכנים לגלוש?</h2>
            <p className="text-white/70 text-sm mb-6">אספו מטבעות 🪙, היזהרו מעצים 🌲 וסלעים 🪨.<br/>חיצים ← → או הכפתורים למטה.</p>
            <button onClick={start} className="bg-blue-600 hover:bg-blue-700 font-black px-10 py-3.5 rounded-xl transition">התחל ←</button>
          </div>
        )}

        {/* Game over */}
        {phase === "over" && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center px-6">
            <h2 className="font-display text-2xl font-black mb-1">נפלת! 💥</h2>
            <p className="text-white/70 text-sm mb-1">מרחק: {score} מ׳</p>
            <p className="text-amber-300 font-black text-lg mb-1">+{runCoins} 🪙 נוספו לארנק</p>
            <p className="text-white/50 text-xs mb-6">סה״כ בארנק: {wallet.toLocaleString()} מטבעות</p>
            <div className="flex gap-3">
              <button onClick={start} className="bg-blue-600 hover:bg-blue-700 font-black px-8 py-3 rounded-xl transition">שוב ←</button>
              <button onClick={() => { setShowShop(true); setRedeemed(null); }} className="bg-amber-400 text-slate-900 font-black px-8 py-3 rounded-xl transition">לחנות 🛒</button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile controls */}
      <div className="w-full max-w-[400px] grid grid-cols-2 gap-3 mt-4 px-1">
        <button onTouchStart={(e)=>{e.preventDefault();move(-1);}} onClick={() => move(-1)}
          className="bg-white/10 active:bg-white/25 border border-white/10 rounded-2xl py-5 text-2xl font-black select-none">←</button>
        <button onTouchStart={(e)=>{e.preventDefault();move(1);}} onClick={() => move(1)}
          className="bg-white/10 active:bg-white/25 border border-white/10 rounded-2xl py-5 text-2xl font-black select-none">→</button>
      </div>

      <p className="text-white/40 text-xs mt-4 mb-10 text-center px-6">המטבעות נשמרים אוטומטית · החנות נפתחת ב-2,000 מטבעות 🪙</p>

      {/* Shop modal */}
      {showShop && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-3" onClick={() => setShowShop(false)}>
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-md p-6 max-h-[88vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-display text-2xl font-black">חנות הקהילה 🛒</h2>
              <button onClick={() => setShowShop(false)} className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-400 text-xl">✕</button>
            </div>
            <p className="text-sm text-slate-500 mb-5">יש לך <b className="text-amber-500">🪙 {wallet.toLocaleString()}</b> מטבעות</p>

            {redeemed ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">🎁</div>
                <h3 className="font-display text-xl font-black mb-1">מימשת: {redeemed.name}</h3>
                <p className="text-slate-500 text-sm mb-3">הצג/י את הקוד הזה לנציג SkiShare:</p>
                <div className="text-2xl font-mono font-black tracking-widest bg-slate-100 rounded-xl py-3 mb-4">{redeemed.code}</div>
                <a href={buildWaHref({ intro: "היי! 🎁 מימשתי מתנה במשחק SkiShare:", lines: [`פריט: ${redeemed.name}`, `קוד: ${redeemed.code}`] })}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-block bg-[#25D366] text-white font-bold px-6 py-3 rounded-xl">שלח קוד בוואטסאפ</a>
                <button onClick={() => setRedeemed(null)} className="block w-full text-slate-400 text-sm mt-4">← חזרה לחנות</button>
              </div>
            ) : (
              <div className="space-y-3">
                {SHOP.map(item => {
                  const ok = wallet >= item.cost;
                  return (
                    <div key={item.id} className={`flex items-center gap-3 p-3.5 rounded-2xl border ${ok ? "border-slate-200" : "border-slate-100 opacity-70"}`}>
                      <span className="text-3xl">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <button onClick={() => redeem(item)} disabled={!ok}
                        className={`flex-shrink-0 font-black text-sm px-4 py-2.5 rounded-xl transition ${ok ? "bg-amber-400 text-slate-900 hover:bg-amber-300" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
                        {ok ? "מימוש" : "🪙 " + item.cost.toLocaleString()}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
