"use client";

import { useState } from "react";

export default function GatewayControls({ initialState }: { initialState: string }) {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState<string | null>(null);

  const doAction = async (action: "restart" | "stop") => {
    setLoading(action);
    try {
      const res = await fetch("/api/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setState(action === "stop" ? "stopped" : "restarting...");
        // Poll for new state
        setTimeout(async () => {
          try {
            const r = await fetch("/api/gateway");
            const d = await r.json();
            setState(d.state || "unknown");
          } catch { /* ignore */ }
        }, 5000);
      }
    } catch { /* ignore */ }
    finally { setLoading(null); }
  };

  const isRunning = state === "running";

  return (
    <div className="flex items-center gap-2">
      <div className="synth-chip mr-2 border-[rgba(89,242,163,0.28)] bg-[rgba(18,56,44,0.28)]">
        <div className={`h-2 w-2 rounded-full ${isRunning ? "bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.8)]" : "bg-[#b184c9]"}`} />
        <span className="text-xs font-mono text-[#eafcf2]">{state}</span>
      </div>
      <button
        onClick={() => doAction("restart")}
        disabled={loading !== null}
        className="btn-neon flex items-center gap-1.5 px-3 py-2 text-xs"
      >
        {loading === "restart" ? (
          <div className="w-3 h-3 border border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
        ) : (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
        Restart
      </button>
      <button
        onClick={() => doAction("stop")}
        disabled={loading !== null || !isRunning}
        className="btn-danger flex items-center gap-1.5 px-3 py-2 text-xs disabled:opacity-30"
      >
        {loading === "stop" ? (
          <div className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
        ) : (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
        )}
        Stop
      </button>
    </div>
  );
}
