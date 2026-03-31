"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface SkillResult {
  name: string;
  description: string;
  source: string;
  trust: string;
  identifier: string;
}

export default function SkillHubPanel() {
  const router = useRouter();
  const [query, setQuery] = useState("telegram");
  const [category, setCategory] = useState("");
  const [results, setResults] = useState<SkillResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  async function doSearch() {
    setSearching(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/admin?action=skillsSearch&query=${encodeURIComponent(query)}&limit=8`);
      const data = await res.json();
      setResults(data.results || []);
      setHasSearched(true);
    } catch {
      setError("Unable to search Hermes skill registries");
    } finally {
      setSearching(false);
    }
  }

  async function install(identifier: string) {
    setError("");
    setMessage("");
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "installSkill", identifier, category }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      setError(data.error || data.message || "Unable to install skill");
      return;
    }
    setMessage(data.message || "Skill installed");
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void doSearch();
            }
          }}
          placeholder="Search skill registries"
          className="w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(11,4,21,0.55)] px-3 py-2.5 text-sm text-white outline-none focus:border-[rgba(57,230,255,0.35)]"
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Install category"
          className="w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(11,4,21,0.55)] px-3 py-2.5 text-sm text-white outline-none focus:border-[rgba(57,230,255,0.35)]"
        />
        <button onClick={doSearch} disabled={searching} className="btn-neon px-4 py-2.5 text-sm">
          {searching ? "Searching..." : "Search"}
        </button>
      </div>

      {(message || error) && (
        <div className={`rounded-2xl px-4 py-3 text-sm ${error ? "border border-[rgba(255,132,121,0.35)] bg-[rgba(88,27,29,0.48)] text-[#ffd0d0]" : "border border-[rgba(89,242,163,0.35)] bg-[rgba(23,73,53,0.35)] text-[#c9ffe0]"}`}>
          {error || message}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result) => (
            <div
              key={result.identifier}
              className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(11,4,21,0.42)] px-4 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{result.name}</p>
                  <p className="mt-1 text-xs text-[#f6c8ea]">{result.description || "Community skill"}</p>
                  <p className="mt-2 text-[11px] text-[#d6b0de]">
                    {result.identifier} · {result.source} · {result.trust}
                  </p>
                </div>
                <button onClick={() => install(result.identifier)} className="btn-neon px-3 py-2 text-xs">
                  Install
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasSearched && !searching && results.length === 0 && !error && (
        <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(11,4,21,0.42)] px-4 py-4 text-sm text-[#f6c8ea]">
          No skills matched that search. Try a broader keyword or a different install category.
        </div>
      )}
    </div>
  );
}
