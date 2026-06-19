"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { buildWaHref } from "@/lib/whatsapp";

/* ── Config ─────────────────────────────────────────────── */
const W = 400, H = 640;
const LANES = 3;
const ROAD_W = 312, ROAD_X = (W - ROAD_W) / 2;
const PLAYER_Y = H - 100;
const COIN_KEY = "skishare_coins";

const laneX = (i: number) => ROAD_X + (ROAD_W * (i + 0.5)) / LANES;

type Entity = { lane: number; y: number; type: "coin" | "tree" | "rock"; done?: boolean };
type SideTree = { side: 0 | 1; y: number; s: number };

const SHOP = [
  { id: "socks", name: "גרבי SkiShare", cost: 1500, icon: "🧦", desc: "גרביים חמים לעונה" },
  { id: "mug",   name: "מאג SkiShare",  cost: 2500, icon: "☕", desc: "כוס תרמית ממותגת" },
  { id: "beanie",name: "כובע גרב",      cost: 3000, icon: "🧢", desc: "כובע SkiShare" },
  { id: "party", name: "כניסה חינם למסיבה", cost: 4000, icon: "🎟️", desc: "כרטיס לאירוע הקהילה" },
];

/* ── Vector sprites ─────────────────────────────────────── */
function drawSkier(ctx: CanvasRenderingContext2D, x: number, y: number, lean: number) {
  ctx.save();
  ctx.translate(x, y);
  // shadow
  ctx.fillStyle = "rgba(15,23,42,0.18)";
  ctx.beginPath(); ctx.ellipse(0, 26, 17, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(lean * 0.18);
  // skis
  ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 3.5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-9, 26); ctx.lineTo(-7, -4); ctx.moveTo(9, 26); ctx.lineTo(7, -4); ctx.stroke();
  // poles
  ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-12, -2); ctx.lineTo(-14, 18); ctx.moveTo(12, -2); ctx.lineTo(14, 18); ctx.stroke();
  // body
  ctx.fillStyle = "#2563eb";
  ctx.beginPath(); ctx.roundRect(-10, -8, 20, 22, 7); ctx.fill();
  // scarf
  ctx.fillStyle = "#f59e0b"; ctx.fillRect(-9, -8, 18, 4);
  // head
  ctx.fillStyle = "#f1c8a0"; ctx.beginPath(); ctx.arc(0, -14, 7, 0, Math.PI * 2); ctx.fill();
  // helmet
  ctx.fillStyle = "#111827"; ctx.beginPath(); ctx.arc(0, -15, 7.5, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#38bdf8"; ctx.fillRect(-6, -15, 12, 3); // goggles
  ctx.restore();
}

function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const spin = 0.3 + 0.7 * Math.abs(Math.cos(t / 260 + x * 0.05));
  ctx.save(); ctx.translate(x, y); ctx.scale(spin, 1);
  ctx.fillStyle = "rgba(15,23,42,0.12)"; ctx.beginPath(); ctx.ellipse(0, 16, 11, 3, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#d97706"; ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.arc(-3, -3, 3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#b45309"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("€", 0, 1);
  ctx.restore();
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = "rgba(15,23,42,0.15)"; ctx.beginPath(); ctx.ellipse(0, 20, 15, 4, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#8b5e34"; ctx.fillRect(-3, 8, 6, 13);
  for (let i = 0; i < 3; i++) {
    const yy = 6 - i * 9, wsp = 15 - i * 3.5;
    ctx.fillStyle = i === 2 ? "#16a34a" : "#15803d";
    ctx.beginPath(); ctx.moveTo(0, yy - 16); ctx.lineTo(wsp, yy + 2); ctx.lineTo(-wsp, yy + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath(); ctx.moveTo(0, yy - 16); ctx.lineTo(5, yy - 7); ctx.lineTo(-5, yy - 7); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawRock(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = "rgba(15,23,42,0.18)"; ctx.beginPath(); ctx.ellipse(0, 14, 17, 5, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#64748b";
  ctx.beginPath();
  ctx.moveTo(-16, 12); ctx.lineTo(-10, -8); ctx.lineTo(4, -12); ctx.lineTo(16, -2); ctx.lineTo(14, 12); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#94a3b8"; ctx.beginPath();
  ctx.moveTo(-10, -8); ctx.lineTo(4, -12); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.beginPath();
  ctx.moveTo(-10, -8); ctx.lineTo(4, -12); ctx.lineTo(2, -7); ctx.lineTo(-8, -4); ctx.closePath(); ctx.fill();
  ctx.restore();
}

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [wallet, setWallet] = useState(0);
  const [runCoins, setRunCoins] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [showShop, setShowShop] = useState(false);
  const [redeemed, setRedeemed] = useState<{ name: string; code: string } | null>(null);

  const g = useRef({
    lane: 1, px: laneX(1), tilt: 0, entities: [] as Entity[], sides: [] as SideTree[],
    speed: 200, spawnT: 0, dist: 0, coins: 0, raf: 0, last: 0, running: false,
  });

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") move(-1);
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") move(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  const endGame = useCallback(() => {
    const s = g.current;
    s.running = false;
    cancelAnimationFrame(s.raf);
    setPhase("over");
    setWallet(prev => { const next = prev + s.coins; localStorage.setItem(COIN_KEY, String(next)); return next; });
  }, []);

  const loop = useCallback((t: number) => {
    const s = g.current;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dt = Math.min(0.05, (t - s.last) / 1000 || 0);
    s.last = t;

    // update
    s.speed += dt * 9;
    s.dist += s.speed * dt;
    const targetX = laneX(s.lane);
    s.tilt = Math.max(-1, Math.min(1, (targetX - s.px) / 60));
    s.px += (targetX - s.px) * Math.min(1, dt * 13);

    // spawn entities — obstacle-heavy
    s.spawnT -= dt;
    if (s.spawnT <= 0) {
      s.spawnT = Math.max(0.4, 0.8 - s.dist / 12000);
      const lane = Math.floor(Math.random() * LANES);
      const isCoin = Math.random() < 0.34;            // fewer coins
      s.entities.push({ lane, y: -40, type: isCoin ? "coin" : (Math.random() < 0.5 ? "tree" : "rock") });
    }
    for (const e of s.entities) e.y += s.speed * dt;

    // side forest spawn
    if (Math.random() < dt * 6) s.sides.push({ side: Math.random() < 0.5 ? 0 : 1, y: -30, s: 0.8 + Math.random() * 0.7 });
    for (const d of s.sides) d.y += s.speed * dt;
    s.sides = s.sides.filter(d => d.y < H + 40);

    // collisions
    for (const e of s.entities) {
      if (!e.done && Math.abs(e.y - PLAYER_Y) < 32 && e.lane === s.lane) {
        if (e.type === "coin") { e.done = true; s.coins += 1; setRunCoins(s.coins); }
        else { endGame(); return; }
      }
    }
    s.entities = s.entities.filter(e => e.y < H + 40 && !e.done);
    setScore(Math.floor(s.dist / 10));

    /* draw */
    // sky/slope gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#bfdbfe"); grad.addColorStop(0.4, "#e0f2fe"); grad.addColorStop(1, "#ffffff");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // snow banks (sides)
    ctx.fillStyle = "#eef2f7"; ctx.fillRect(0, 0, ROAD_X, H); ctx.fillRect(ROAD_X + ROAD_W, 0, ROAD_X, H);
    // groomed road
    ctx.fillStyle = "#f8fafc"; ctx.fillRect(ROAD_X, 0, ROAD_W, H);
    // moving corduroy lines for speed
    ctx.strokeStyle = "rgba(148,163,184,0.18)"; ctx.lineWidth = 2;
    const off = s.dist % 36;
    for (let y = -36 + off; y < H; y += 36) { ctx.beginPath(); ctx.moveTo(ROAD_X, y); ctx.lineTo(ROAD_X + ROAD_W, y); ctx.stroke(); }
    // lane dividers
    ctx.strokeStyle = "rgba(148,163,184,0.30)"; ctx.setLineDash([16, 20]); ctx.lineDashOffset = -(s.dist % 36);
    for (let i = 1; i < LANES; i++) { const x = ROAD_X + (ROAD_W * i) / LANES; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    ctx.setLineDash([]);

    // side forest
    for (const d of s.sides) drawTree(ctx, d.side === 0 ? ROAD_X * 0.5 : ROAD_X + ROAD_W + ROAD_X * 0.5, d.y, d.s);

    // entities
    for (const e of s.entities) {
      if (e.type === "coin") drawCoin(ctx, laneX(e.lane), e.y, t);
      else if (e.type === "tree") drawTree(ctx, laneX(e.lane), e.y, 1);
      else drawRock(ctx, laneX(e.lane), e.y);
    }
    // player
    drawSkier(ctx, s.px, PLAYER_Y, s.tilt);

    s.raf = requestAnimationFrame(loop);
  }, [endGame]);

  const start = useCallback(() => {
    const s = g.current;
    s.lane = 1; s.px = laneX(1); s.tilt = 0; s.entities = []; s.sides = [];
    s.speed = 200; s.spawnT = 0; s.dist = 0; s.coins = 0; s.last = performance.now(); s.running = true;
    setRunCoins(0); setScore(0); setPhase("playing");
    cancelAnimationFrame(s.raf); s.raf = requestAnimationFrame(loop);
  }, [loop]);

  useEffect(() => () => cancelAnimationFrame(g.current.raf), []);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr; c.height = H * dpr;
    c.getContext("2d")!.scale(dpr, dpr);
  }, []);

  const redeem = (item: typeof SHOP[number]) => {
    if (wallet < item.cost) return;
    saveWallet(wallet - item.cost);
    setRedeemed({ name: item.name, code: "SKI-" + Math.random().toString(36).slice(2, 7).toUpperCase() });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center" dir="rtl">
      <div className="w-full max-w-md flex items-center justify-between px-4 py-3">
        <a href="/seasonaires" className="text-white/60 hover:text-white text-sm transition">→ חזרה</a>
        <img src="/skishare-logo.png" alt="SkiShare" className="h-8 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
        <button onClick={() => { setShowShop(true); setRedeemed(null); }}
          className="flex items-center gap-1.5 bg-amber-400 text-slate-900 font-black text-sm px-3 py-1.5 rounded-full">
          🪙 {wallet.toLocaleString()}
        </button>
      </div>

      <h1 className="font-display text-2xl font-black mt-1 mb-3">סקישר ראן 🎿</h1>

      <div className="relative w-full max-w-[400px] aspect-[400/640] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

        {phase === "playing" && (
          <div className="absolute top-3 inset-x-3 flex items-center justify-between text-slate-900 font-black">
            <span className="bg-white/85 rounded-full px-3 py-1 text-sm">🪙 {runCoins}</span>
            <span className="bg-white/85 rounded-full px-3 py-1 text-sm">{score} מ׳</span>
          </div>
        )}

        {phase === "idle" && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center px-6">
            <div className="text-6xl mb-4">⛷️</div>
            <h2 className="font-display text-2xl font-black mb-2">מוכנים לגלוש?</h2>
            <p className="text-white/70 text-sm mb-6">אספו מטבעות, היזהרו מעצים וסלעים.<br/>חיצים ← → או הכפתורים למטה.</p>
            <button onClick={start} className="bg-blue-600 hover:bg-blue-700 font-black px-10 py-3.5 rounded-xl transition">התחל ←</button>
          </div>
        )}

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

      {/* Controls — dir=ltr so left button is physically left */}
      <div dir="ltr" className="w-full max-w-[400px] grid grid-cols-2 gap-3 mt-4 px-1">
        <button onPointerDown={(e) => { e.preventDefault(); move(-1); }}
          className="bg-white/10 active:bg-blue-600 border border-white/10 rounded-2xl py-6 text-3xl font-black select-none touch-none transition-colors">←</button>
        <button onPointerDown={(e) => { e.preventDefault(); move(1); }}
          className="bg-white/10 active:bg-blue-600 border border-white/10 rounded-2xl py-6 text-3xl font-black select-none touch-none transition-colors">→</button>
      </div>

      <p className="text-white/40 text-xs mt-4 mb-10 text-center px-6">המטבעות נשמרים אוטומטית · החנות נפתחת ב-2,000 מטבעות 🪙</p>

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
