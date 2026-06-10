"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface FlareEvent {
  flareClass: string;
  time: Date;
}

const FLARE_CLASSES = ["A", "B", "C", "M", "X"];
const FLARE_COLORS: Record<string, string> = {
  A: "#59f2a3",
  B: "#39e6ff",
  C: "#ffb14a",
  M: "#ff8c42",
  X: "#ff5555",
};

function getActivity(kp: number): "quiet" | "active" | "storm" {
  if (kp < 3) return "quiet";
  if (kp < 6) return "active";
  return "storm";
}

const ACTIVITY_STYLE = {
  quiet:  { bg: "rgba(89,242,163,0.12)",  border: "rgba(89,242,163,0.35)",  text: "#59f2a3" },
  active: { bg: "rgba(255,177,74,0.12)",  border: "rgba(255,177,74,0.35)",  text: "#ffb14a" },
  storm:  { bg: "rgba(255,79,79,0.12)",   border: "rgba(255,100,100,0.35)", text: "#ff6b6b" },
};

export default function SolarAuroraWidget() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const gfxRef = useRef({ t: 0, flareIntensity: 0, flareDecay: 0 });

  const [kpIndex, setKpIndex] = useState(3.7);
  const [flareActive, setFlareActive] = useState(false);
  const [lastFlare, setLastFlare] = useState<FlareEvent | null>(null);
  const [nextFlareIn, setNextFlareIn] = useState(12);

  const triggerFlare = useCallback((classIdx: number) => {
    const cls = FLARE_CLASSES[classIdx];
    const intensity = (classIdx + 1) / 5;
    const newKp = Math.min(9, 1 + classIdx * 1.6 + Math.random() * 1.5);

    gfxRef.current.flareIntensity = intensity;
    gfxRef.current.flareDecay = 1.0;

    setFlareActive(true);
    setKpIndex(Math.round(newKp * 10) / 10);
    setLastFlare({ flareClass: cls, time: new Date() });

    setTimeout(() => {
      setFlareActive(false);
      setKpIndex((prev) => Math.max(1.2, prev - 2.5 + Math.random()));
    }, 10_000);
  }, []);

  // Auto-schedule flares
  useEffect(() => {
    let countdown = 12;
    const timer = setInterval(() => {
      countdown--;
      setNextFlareIn(countdown);
      if (countdown <= 0) {
        triggerFlare(Math.floor(Math.random() * 5));
        countdown = 8 + Math.floor(Math.random() * 15);
        setNextFlareIn(countdown);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [triggerFlare]);

  // Canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;

    const resize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Pre-generate stable star positions
    const STARS = Array.from({ length: 80 }, (_, i) => ({
      x: ((i * 137.508) % 1000) / 1000,
      y: ((i * 79.317 + 11) % 550) / 1000,
      r: 0.3 + (i % 5) * 0.22,
      phase: (i * 0.618) * Math.PI * 2,
    }));

    const BANDS = [
      { y: 0.24, amp: 0.08, freq: 0.9,  spd: 0.55, thick: 0.10, c1: [89,242,163],  c2: [57,230,255],  base: 0.32 },
      { y: 0.35, amp: 0.05, freq: 1.2,  spd: 0.42, thick: 0.08, c1: [57,230,255],  c2: [100,80,255],  base: 0.26 },
      { y: 0.44, amp: 0.04, freq: 1.5,  spd: 0.70, thick: 0.06, c1: [140,60,255],  c2: [255,79,216],  base: 0.22 },
    ] as const;

    const wave = (x: number, freq: number, spd: number, t: number) =>
      Math.sin(x * freq * 0.012 + t * spd) +
      0.5 * Math.sin(x * freq * 0.022 + t * spd * 1.4 + 2.1);

    const draw = () => {
      const g = gfxRef.current;
      g.t += 0.006;
      if (g.flareDecay > 0) g.flareDecay = Math.max(0, g.flareDecay - 0.004);

      if (!W || !H) { animRef.current = requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, W, H);

      // Sky
      const fd = g.flareDecay * g.flareIntensity;
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0,   `rgba(6,2,14,${0.98 - fd * 0.08})`);
      skyGrad.addColorStop(0.5, `rgba(12,5,26,0.92)`);
      skyGrad.addColorStop(1,   `rgba(20,7,38,0.7)`);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Stars — dim during flares
      for (const star of STARS) {
        if (star.y > 0.55) continue;
        const brightness = (0.35 + 0.55 * Math.sin(g.t * 0.8 + star.phase)) * (1 - fd * 0.6);
        ctx.beginPath();
        ctx.arc(star.x * W, star.y * H, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${brightness})`;
        ctx.fill();
      }

      // Aurora curtain bands
      const boost = fd * 0.55;
      for (const band of BANDS) {
        const alpha = band.base + boost;
        ctx.beginPath();
        for (let px = 0; px <= W; px += 4) {
          const py = H * (band.y + wave(px, band.freq, band.spd, g.t) * band.amp);
          if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        for (let px = W; px >= 0; px -= 4) {
          const py = H * (band.y + wave(px, band.freq, band.spd, g.t) * band.amp + band.thick);
          ctx.lineTo(px, py);
        }
        ctx.closePath();

        const [r1,g1,b1] = band.c1;
        const [r2,g2,b2] = band.c2;
        const grad = ctx.createLinearGradient(0, H*(band.y-0.03), 0, H*(band.y+band.thick+0.03));
        grad.addColorStop(0,    `rgba(${r1},${g1},${b1},0)`);
        grad.addColorStop(0.25, `rgba(${r1},${g1},${b1},${alpha})`);
        grad.addColorStop(0.65, `rgba(${r2},${g2},${b2},${alpha*0.85})`);
        grad.addColorStop(1,    `rgba(${r2},${g2},${b2},0)`);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Extra flare-triggered aurora bands
      if (g.flareDecay > 0.01) {
        const fa = g.flareDecay * g.flareIntensity;

        // High-energy orange/red band
        ctx.beginPath();
        for (let px = 0; px <= W; px += 4) {
          const py = H * (0.17 + wave(px, 0.6, 1.1, g.t) * 0.09);
          if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        for (let px = W; px >= 0; px -= 4) {
          const py = H * (0.17 + wave(px, 0.6, 1.1, g.t) * 0.09 + 0.09);
          ctx.lineTo(px, py);
        }
        ctx.closePath();
        const og = ctx.createLinearGradient(0, H*0.12, 0, H*0.30);
        og.addColorStop(0,    `rgba(255,177,74,0)`);
        og.addColorStop(0.3,  `rgba(255,177,74,${fa*0.55})`);
        og.addColorStop(0.7,  `rgba(255,100,60,${fa*0.45})`);
        og.addColorStop(1,    `rgba(255,79,100,0)`);
        ctx.fillStyle = og;
        ctx.fill();

        // Solar corona at horizon
        const cx = W * 0.5;
        const cy = H * 0.95;
        const cr = Math.max(60, W * 0.28 * fa);
        const corona = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
        corona.addColorStop(0,   `rgba(255,230,140,${0.7*fa})`);
        corona.addColorStop(0.2, `rgba(255,140,50,${0.4*fa})`);
        corona.addColorStop(0.5, `rgba(255,79,160,${0.18*fa})`);
        corona.addColorStop(1,   "rgba(255,79,216,0)");
        ctx.fillStyle = corona;
        ctx.fillRect(0, 0, W, H);

        // Rays
        ctx.save();
        ctx.translate(cx, cy);
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + g.t * 0.3;
          const rLen = cr * (0.7 + 0.3 * Math.sin(g.t * 2 + i));
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * 6, Math.sin(angle) * 6);
          ctx.lineTo(Math.cos(angle) * rLen, Math.sin(angle) * rLen);
          ctx.strokeStyle = `rgba(255,200,80,${0.22*fa})`;
          ctx.lineWidth = 1.5 + fa * 3;
          ctx.stroke();
        }
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, []);

  const activity = getActivity(kpIndex);
  const ac = ACTIVITY_STYLE[activity];

  return (
    <div className="synth-panel overflow-hidden">
      {/* Aurora canvas */}
      <div className="relative h-[260px] overflow-hidden rounded-t-[22px]">
        <canvas ref={canvasRef} className="h-full w-full" />

        {/* Kp badge */}
        <div className="absolute left-3 top-3 rounded-xl border border-[rgba(57,230,255,0.22)] bg-[rgba(6,2,14,0.72)] px-3 py-2 backdrop-blur-sm">
          <div className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#7befff]">Kp Index</div>
          <div className="mt-0.5 text-2xl font-black text-white">{kpIndex.toFixed(1)}</div>
        </div>

        {/* Activity badge */}
        <div
          className="absolute right-3 top-3 rounded-xl border px-3 py-1.5 backdrop-blur-sm"
          style={{ background: ac.bg, borderColor: ac.border }}
        >
          <div className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: ac.text }}>
            {activity}
          </div>
        </div>

        {/* Flare alert */}
        {flareActive && lastFlare && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-xl border border-[rgba(255,177,74,0.5)] bg-[rgba(200,80,20,0.22)] px-4 py-1.5 backdrop-blur-sm" style={{ animation: "gentle-pulse 1s ease-in-out infinite" }}>
            <span className="whitespace-nowrap text-xs font-bold tracking-[0.18em] text-[#ffd080]">
              ⚡ CLASS-{lastFlare.flareClass} SOLAR FLARE
            </span>
          </div>
        )}
      </div>

      {/* Info panel */}
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="card-title">Solar Aurora Activity</div>
            <p className="mt-1 text-xs text-[#d6b0de]">Live space-weather & aurora forecast</p>
          </div>
          {lastFlare && (
            <div className="text-right text-[11px] text-[#d6b0de]">
              <div>Last: Class&nbsp;
                <span className="font-bold" style={{ color: FLARE_COLORS[lastFlare.flareClass] }}>
                  {lastFlare.flareClass}
                </span>
              </div>
              <div>{lastFlare.time.toLocaleTimeString()}</div>
            </div>
          )}
        </div>

        {/* Kp gauge */}
        <div className="mt-3">
          <div className="mb-1.5 flex justify-between text-[10px] text-[#9080a8]">
            <span>Planetary K Index</span>
            <span>{kpIndex.toFixed(1)} / 9</span>
          </div>
          <div className="relative h-2.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${(kpIndex / 9) * 100}%`,
                background:
                  activity === "quiet"
                    ? "linear-gradient(90deg,#59f2a3,#39e6ff)"
                    : activity === "active"
                      ? "linear-gradient(90deg,#ffb14a,#ff8c42)"
                      : "linear-gradient(90deg,#ff6b6b,#ff4fd8)",
                boxShadow: `0 0 10px ${ac.text}88`,
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-[#7060a0]">
            <span>Quiet</span>
            <span>Unsettled</span>
            <span>Active</span>
            <span>Storm</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            {
              label: "Next Flare",
              value: flareActive ? "NOW" : `${nextFlareIn}s`,
              color: flareActive ? "#ff8c42" : "#7befff",
            },
            {
              label: "Flare Class",
              value: lastFlare?.flareClass ?? "—",
              color: lastFlare ? FLARE_COLORS[lastFlare.flareClass] : "#6050a0",
            },
            {
              label: "Visibility",
              value: activity === "quiet" ? "Low" : activity === "active" ? "Good" : "High",
              color: ac.text,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(18,8,33,0.55)] px-2 py-2 text-center"
            >
              <div className="text-[9px] uppercase tracking-[0.2em] text-[#7060a0]">{item.label}</div>
              <div className="mt-1 text-base font-bold" style={{ color: item.color }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
