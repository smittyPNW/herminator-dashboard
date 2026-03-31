"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navItems } from "@/components/navItems";

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<string>("unknown");

  useEffect(() => {
    fetch("/api/gateway")
      .then((r) => r.json())
      .then((d) => setGatewayStatus(d.state || "unknown"))
      .catch(() => setGatewayStatus("error"));
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const statusTone = gatewayStatus === "running"
    ? "text-emerald-300"
    : gatewayStatus === "error" || gatewayStatus === "stopped"
      ? "text-red-300"
      : "text-amber-300";

  return (
    <>
      <div className="mobile-command-bar fixed inset-x-0 top-0 z-[60] border-b border-[rgba(255,79,216,0.14)] md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(57,230,255,0.18)] bg-[rgba(15,5,27,0.82)] text-[#8ceeff]"
            aria-label="Open navigation"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.34em] text-[#ffd0ef]">Herminator</p>
            <p className="text-sm font-semibold text-white">Operator Dashboard</p>
          </div>
          <div className={`rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(15,5,27,0.82)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusTone}`}>
            {gatewayStatus}
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[80] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[rgba(4,1,12,0.72)] backdrop-blur-md"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[88vw] max-w-[340px] flex-col border-r border-[rgba(57,230,255,0.14)] bg-[linear-gradient(180deg,rgba(14,4,26,0.98),rgba(10,3,23,0.95))] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-[rgba(255,79,216,0.14)] px-5 py-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.34em] text-[#ffd0ef]">Herminator</p>
                <h2 className="mt-1 text-xl font-black text-white">Navigation</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] text-[#f6d5ef]"
                aria-label="Close navigation"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="border-b border-[rgba(255,79,216,0.08)] px-5 py-4">
              <div className="rounded-2xl border border-[rgba(57,230,255,0.16)] bg-[rgba(57,230,255,0.06)] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#d9b1df]">Gateway State</p>
                <p className={`mt-2 text-lg font-semibold ${statusTone}`}>{gatewayStatus}</p>
              </div>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
              {navItems.map((item) => {
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-all ${
                      isActive
                        ? "border-[rgba(57,230,255,0.28)] bg-[linear-gradient(135deg,rgba(57,230,255,0.12),rgba(255,79,216,0.08))] text-[#8ceeff]"
                        : "border-transparent bg-[rgba(255,255,255,0.02)] text-[#f3caef]"
                    }`}
                  >
                    <svg className="h-[18px] w-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-[rgba(255,79,216,0.08)] px-4 py-4">
              <form action="/api/auth?action=logout" method="POST">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm font-medium text-[#f3caef]"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
