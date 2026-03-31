"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; left: number; delay: number; duration: number; size: number }>>([]);
  const router = useRouter();

  useEffect(() => {
    const p = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 8 + Math.random() * 12,
      size: 1 + Math.random() * 2,
    }));
    setParticles(p);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok || res.redirected) {
        router.push("/");
        router.refresh();
      } else {
        setError(true);
        setPassword("");
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute bottom-0 rounded-full bg-[#00d4ff]"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: 0,
              animation: `particle-float ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="hero-haze" />
      <div className="sunset-halo opacity-80" />
      <div className="sun-reflection opacity-45" />
      <div className="retro-palms left" />
      <div className="retro-palms right" />
      <div className="retro-mountains left opacity-35" />
      <div className="retro-mountains right opacity-35" />

      <div className="relative z-10 grid w-full max-w-6xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="hidden lg:block">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.42em] text-[#ffcaef]">Authenticate</p>
          <h1 className="headline-display glow-text max-w-3xl text-6xl font-black text-white">
            Secure access to the Hermes operator console.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#f6c8ea]">
            Sign in to manage gateway health, cron automation, profiles, skills, and sessions from one polished control surface.
          </p>
        </div>

        <div className="w-full max-w-md justify-self-center lg:justify-self-end">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="relative inline-block">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(255,179,74,0.45)] bg-[radial-gradient(circle_at_35%_35%,rgba(255,197,108,1),rgba(255,116,115,0.82)_55%,rgba(124,48,185,0.3)_100%)] shadow-[0_0_34px_rgba(255,126,167,0.35)]">
              <svg className="h-10 w-10 text-[rgba(73,18,79,0.92)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="absolute -inset-5 rounded-full bg-[rgba(255,79,216,0.12)] blur-2xl" />
          </div>
          <h1 className="glow-text text-4xl font-black tracking-[0.08em] text-white">Herminator</h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.34em] text-[#ffd0ef]">Operator Dashboard</p>
        </div>

        {/* Login card */}
        <div className="glass-card-strong rounded-[28px] p-8 shadow-[0_0_60px_rgba(255,79,216,0.08)]">
          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-[rgba(255,132,121,0.24)] bg-[rgba(88,27,29,0.48)] p-3.5 text-sm text-[#ffd3d3]">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Invalid password. Please try again.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="mb-2.5 block text-[10px] font-semibold uppercase tracking-[0.32em] text-[#d8afd7]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              className="w-full rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(11,4,21,0.7)] px-4 py-3 text-sm text-white placeholder-[#8d73a8] focus:border-[#39e6ff] focus:outline-none focus:ring-1 focus:ring-[#39e6ff]/30 focus:shadow-[0_0_20px_rgba(57,230,255,0.08)]"
              placeholder="Enter dashboard password"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-neon mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] disabled:opacity-30"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.28em] text-[#d8afd7]">
          Secured Connection
        </p>
        </div>
      </div>
    </div>
  );
}
