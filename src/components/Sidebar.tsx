"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navItems } from "@/components/navItems";

interface FleetStatus {
  state: string;
  runningInstances: number;
  totalInstances: number;
  totalJobs: number;
  connectedPlatforms: number;
}

export default function Sidebar({ initialFleet }: { initialFleet?: FleetStatus | null }) {
  const pathname = usePathname();
  const [fleet, setFleet] = useState<FleetStatus>({
    state: initialFleet?.state || "unknown",
    runningInstances: initialFleet?.runningInstances || 0,
    totalInstances: initialFleet?.totalInstances || 0,
    totalJobs: initialFleet?.totalJobs || 0,
    connectedPlatforms: initialFleet?.connectedPlatforms || 0,
  });

  useEffect(() => {
    fetch("/api/gateway")
      .then((r) => r.json())
      .then((d) => setFleet({
        state: d.state || "unknown",
        runningInstances: Number(d.runningInstances || 0),
        totalInstances: Number(d.totalInstances || 0),
        totalJobs: Number(d.totalJobs || 0),
        connectedPlatforms: Number(d.connectedPlatforms || 0),
      }))
      .catch(() => setFleet((current) => ({ ...current, state: "error" })));

    const interval = setInterval(() => {
      fetch("/api/gateway")
        .then((r) => r.json())
        .then((d) => setFleet({
          state: d.state || "unknown",
          runningInstances: Number(d.runningInstances || 0),
          totalInstances: Number(d.totalInstances || 0),
          totalJobs: Number(d.totalJobs || 0),
          connectedPlatforms: Number(d.connectedPlatforms || 0),
        }))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = fleet.state === "running"
    ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
    : fleet.state === "error" || fleet.state === "stopped"
    ? "bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
    : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]";

  return (
    <aside className="sidebar-glow fixed left-0 top-0 z-50 hidden h-screen w-[244px] flex-col border-r border-[rgba(57,230,255,0.14)] bg-[linear-gradient(180deg,rgba(14,4,26,0.92),rgba(10,3,23,0.82))] backdrop-blur-xl md:flex">
      {/* Logo area */}
      <div className="border-b border-[rgba(255,79,216,0.14)] px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(255,179,74,0.5)] bg-[radial-gradient(circle_at_35%_35%,rgba(255,197,108,1),rgba(255,116,115,0.82)_55%,rgba(124,48,185,0.3)_100%)] shadow-[0_0_28px_rgba(255,126,167,0.35)]">
              <svg className="h-5 w-5 text-[rgba(73,18,79,0.92)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#180622] ${statusColor}`} />
          </div>
          <div>
            <h1 className="glow-text text-[1.22rem] font-black leading-none tracking-[0.01em] text-[#fff7fe]">
              Herminator
            </h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.32em] text-[#cfa9df]">Operator Dashboard</p>
          </div>
        </div>
      </div>

      {/* System status bar */}
      <div className="border-b border-[rgba(255,79,216,0.08)] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
            <span className="text-[10px] uppercase tracking-[0.22em] text-[#b184c9]">Fleet</span>
          </div>
          <span className={`text-[10px] font-mono ${
            fleet.state === "running" ? "text-emerald-300" : "text-[#cfa9df]"
          }`}>{fleet.state}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.18em] text-[#cfa9df]">
          <span>{fleet.runningInstances}/{fleet.totalInstances} live</span>
          <span>{fleet.totalJobs} jobs</span>
          <span>{fleet.connectedPlatforms} links</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <div className="px-3 mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8d73a8]">Navigation</span>
        </div>
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                isActive
                  ? "nav-active text-[#73f1ff]"
                  : "text-[#e8c0ea] hover:bg-[rgba(255,255,255,0.04)] hover:text-white"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#39e6ff] shadow-[0_0_12px_rgba(57,230,255,0.7)]" />
              )}
              <svg className={`h-[18px] w-[18px] shrink-0 transition-colors ${isActive ? "text-[#39e6ff]" : "text-[#cfa9df] group-hover:text-[#ffb7f0]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span className="font-medium tracking-[0.01em]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="space-y-3 border-t border-[rgba(255,79,216,0.08)] px-3 py-4">
        <div className="synth-panel min-h-[168px] px-4 py-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(255,181,76,0.95),rgba(255,181,76,0.7)_22%,transparent_23%),linear-gradient(180deg,transparent_52%,rgba(13,3,28,0.82)_52%,rgba(13,3,28,0.96)_100%)] opacity-95" />
          <div className="absolute inset-x-3 bottom-8 h-px bg-[rgba(57,230,255,0.45)] shadow-[0_0_12px_rgba(57,230,255,0.7)]" />
          <div className="absolute bottom-8 left-6 h-10 w-1 rounded-full bg-[rgba(32,11,54,0.85)]" />
          <div className="absolute bottom-8 left-6 h-10 w-14 bg-[linear-gradient(25deg,transparent_46%,rgba(32,11,54,0.85)_47%_53%,transparent_54%)]" />
          <div className="absolute bottom-8 left-11 h-10 w-14 bg-[linear-gradient(-25deg,transparent_46%,rgba(32,11,54,0.85)_47%_53%,transparent_54%)]" />
          <div className="absolute bottom-8 right-9 h-12 w-1 rounded-full bg-[rgba(32,11,54,0.85)]" />
          <div className="absolute bottom-8 right-9 h-12 w-16 bg-[linear-gradient(28deg,transparent_46%,rgba(32,11,54,0.85)_47%_53%,transparent_54%)]" />
          <div className="absolute bottom-8 right-14 h-11 w-16 bg-[linear-gradient(-28deg,transparent_46%,rgba(32,11,54,0.85)_47%_53%,transparent_54%)]" />
          <div className="absolute inset-x-3 bottom-3 px-1 text-center">
            <div className="origin-center scale-x-[0.88] text-[1.28rem] font-black uppercase leading-none tracking-[0.12em] text-[#9decff] drop-shadow-[0_0_18px_rgba(57,230,255,0.55)]">
              Herminator
            </div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.34em] text-[#ffd1ee]">
              command surface
            </div>
          </div>
        </div>
        <form action="/api/auth?action=logout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#f3caef] hover:bg-[rgba(255,255,255,0.04)] hover:text-white"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] text-xs font-semibold text-white">
              N
            </span>
            <span className="font-medium">Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
