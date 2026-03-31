"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface ProfileInfo {
  name: string;
  model: string;
  gateway: string;
  alias: string;
  active: boolean;
  path: string;
  skillCount: number;
  provider: string;
}

export default function ProfilesPanel() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    fetch("/api/admin?action=profiles")
      .then((r) => r.json())
      .then((data) => setProfiles(data.profiles || []))
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false));
  }, []);

  async function switchProfile(profileName: string) {
    setMessage("");
    setError("");
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "useProfile", profileName }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      setError(data.error || data.message || "Unable to switch profile");
      return;
    }
    setMessage(data.message || "Profile switched");
    setProfiles((prev) => prev.map((profile) => ({ ...profile, active: profile.name === profileName })));
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      {(message || error) && (
        <div className={`rounded-2xl px-4 py-3 text-sm ${error ? "border border-[rgba(255,132,121,0.35)] bg-[rgba(88,27,29,0.48)] text-[#ffd0d0]" : "border border-[rgba(89,242,163,0.35)] bg-[rgba(23,73,53,0.35)] text-[#c9ffe0]"}`}>
          {error || message}
        </div>
      )}
      {loading ? (
        <p className="text-sm text-[#f6c8ea]">Loading profiles...</p>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {profiles.map((profile) => (
            <div
              key={profile.name}
              className="operator-tile p-4"
            >
              <div className="relative flex h-full flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-white">{profile.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${
                        profile.gateway === "running"
                          ? "border border-[rgba(89,242,163,0.28)] bg-[rgba(23,73,53,0.34)] text-[#bdfdd8]"
                          : "border border-[rgba(255,191,99,0.2)] bg-[rgba(92,54,13,0.28)] text-[#ffd39f]"
                      }`}>
                        {profile.gateway}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[#f0c8ea]">
                      {profile.provider !== "—" ? `${profile.provider} / ` : ""}{profile.model}
                    </p>
                    <p className="mt-1 text-xs text-[#d6b0de]">
                      {profile.skillCount} installed skills
                      {profile.alias !== "—" ? ` · alias ${profile.alias}` : ""}
                    </p>
                  </div>
                  {profile.active && (
                    <span className="rounded-full border border-[rgba(89,242,163,0.28)] bg-[rgba(23,73,53,0.34)] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[#bdfdd8]">
                      active
                    </span>
                  )}
                </div>
                <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(8,3,18,0.38)] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-[#d6afd7]">Hermes Home</p>
                  <p className="mt-2 truncate font-mono text-xs text-[#9cefff]">{profile.path}</p>
                </div>
                {!profile.active && (
                  <div className="flex justify-end">
                    <button onClick={() => switchProfile(profile.name)} className="btn-neon px-3 py-2 text-xs">
                      Activate Profile
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
