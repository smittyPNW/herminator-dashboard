"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function QuickActionsPanel() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [cron, setCron] = useState({
    name: "",
    schedule: "every 1h",
    prompt: "",
    deliver: "origin",
    repeat: "",
    skills: "",
  });
  const [profile, setProfile] = useState({
    profileName: "",
    clone: true,
  });

  async function submitCron() {
    setError("");
    setMessage("");
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createCron", ...cron }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      setError(data.error || data.message || "Unable to create cron job");
      return;
    }
    setMessage("Cron job created.");
    setCron((prev) => ({ ...prev, name: "", prompt: "", repeat: "", skills: "" }));
    startTransition(() => router.refresh());
  }

  async function submitProfile() {
    setError("");
    setMessage("");
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createProfile", ...profile }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      setError(data.error || data.message || "Unable to create profile");
      return;
    }
    setMessage("Profile created.");
    setProfile({ profileName: "", clone: true });
    startTransition(() => router.refresh());
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="synth-panel p-5">
        <div className="mb-5">
          <div className="card-title">Command Deck</div>
          <p className="mt-2 text-sm text-[#f6c8ea]">Use the dashboard as a launch surface, then drop into the dedicated pages for deeper work.</p>
        </div>
        <div className="grid gap-3">
          <LaunchTile
            href="/cron"
            title="Cron Control"
            description="Run the full scheduler surface with pause, resume, run-now, and removal controls."
            detail="Create and manage jobs"
          />
          <LaunchTile
            href="/config"
            title="Profile Matrix"
            description="Switch operator profiles, inspect runtime wiring, and manage Hermes homes with confidence."
            detail="Profiles and environment"
          />
          <LaunchTile
            href="/skills"
            title="Skill Registry"
            description="Search the hub, inspect installed capabilities, and install new skills from a dedicated workspace."
            detail="Library and install flow"
          />
          <LaunchTile
            href="/chat"
            title="Live Console"
            description="Talk to Herminator directly when you want response quality and model routing in one place."
            detail="Realtime operator chat"
          />
        </div>
      </section>

      <section className="synth-panel p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <div className="card-title">Rapid Provisioning</div>
            <p className="mt-2 text-sm text-[#f6c8ea]">Keep the home surface fast. These are the two creation actions that belong on the dashboard itself.</p>
          </div>
          <div className="rounded-full border border-[rgba(57,230,255,0.14)] bg-[rgba(57,230,255,0.06)] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[#8beeff]">
            Native Hermes Actions
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,3,19,0.48)] p-4">
            <div className="mb-4">
              <div className="card-title">Create Cron Job</div>
              <p className="mt-2 text-sm text-[#f6c8ea]">Launch a real Hermes scheduled task without leaving the dashboard.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <LabeledField label="Job Name">
                <input
                  value={cron.name}
                  onChange={(e) => setCron({ ...cron, name: e.target.value })}
                  placeholder="Daily report"
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(11,4,21,0.55)] px-3 py-2.5 text-sm text-white outline-none focus:border-[rgba(57,230,255,0.35)]"
                />
              </LabeledField>
              <LabeledField label="Schedule">
                <input
                  value={cron.schedule}
                  onChange={(e) => setCron({ ...cron, schedule: e.target.value })}
                  placeholder="every 1h"
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(11,4,21,0.55)] px-3 py-2.5 text-sm text-white outline-none focus:border-[rgba(57,230,255,0.35)]"
                />
              </LabeledField>
              <LabeledField label="Deliver">
                <input
                  value={cron.deliver}
                  onChange={(e) => setCron({ ...cron, deliver: e.target.value })}
                  placeholder="origin or telegram"
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(11,4,21,0.55)] px-3 py-2.5 text-sm text-white outline-none focus:border-[rgba(57,230,255,0.35)]"
                />
              </LabeledField>
              <LabeledField label="Skills">
                <input
                  value={cron.skills}
                  onChange={(e) => setCron({ ...cron, skills: e.target.value })}
                  placeholder="news,summary"
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(11,4,21,0.55)] px-3 py-2.5 text-sm text-white outline-none focus:border-[rgba(57,230,255,0.35)]"
                />
              </LabeledField>
            </div>
            <div className="mt-3">
              <LabeledField label="Prompt">
                <textarea
                  value={cron.prompt}
                  onChange={(e) => setCron({ ...cron, prompt: e.target.value })}
                  placeholder="Summarize Hermes health and send me a morning briefing."
                  rows={4}
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(11,4,21,0.55)] px-3 py-2.5 text-sm text-white outline-none focus:border-[rgba(57,230,255,0.35)]"
                />
              </LabeledField>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button disabled={isPending} onClick={submitCron} className="btn-neon px-4 py-2.5 text-sm">
                Create Cron Job
              </button>
              <span className="text-xs text-[#d6b0de]">Uses `hermes cron create`.</span>
            </div>
          </div>

          <div className="rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,3,19,0.48)] p-4">
            <div className="mb-4">
              <div className="card-title">Create Agent Profile</div>
              <p className="mt-2 text-sm text-[#f6c8ea]">
                Hermes profiles are the native isolated-agent unit, so this is the right place to mint a new operator.
              </p>
            </div>
            <LabeledField label="Profile Name">
              <input
                value={profile.profileName}
                onChange={(e) => setProfile({ ...profile, profileName: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                placeholder="morrow"
                className="w-full rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(11,4,21,0.55)] px-3 py-2.5 text-sm text-white outline-none focus:border-[rgba(57,230,255,0.35)]"
              />
            </LabeledField>
            <label className="mt-4 flex items-center gap-3 text-sm text-[#f6c8ea]">
              <input
                type="checkbox"
                checked={profile.clone}
                onChange={(e) => setProfile({ ...profile, clone: e.target.checked })}
                className="h-4 w-4 rounded border-[rgba(255,255,255,0.18)] bg-[rgba(11,4,21,0.55)]"
              />
              Clone active profile defaults
            </label>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button disabled={isPending} onClick={submitProfile} className="btn-neon px-4 py-2.5 text-sm">
                Create Profile
              </button>
              <span className="text-xs text-[#d6b0de]">Uses `hermes profile create`.</span>
            </div>
          </div>
        </div>
      </section>

      {(message || error) && (
        <div className={`xl:col-span-2 rounded-2xl px-4 py-3 text-sm ${error ? "border border-[rgba(255,132,121,0.35)] bg-[rgba(88,27,29,0.48)] text-[#ffd0d0]" : "border border-[rgba(89,242,163,0.35)] bg-[rgba(23,73,53,0.35)] text-[#c9ffe0]"}`}>
          {error || message}
        </div>
      )}
    </div>
  );
}

function LaunchTile({
  href,
  title,
  description,
  detail,
}: {
  href: string;
  title: string;
  description: string;
  detail: string;
}) {
  return (
    <Link href={href} className="operator-tile block p-4">
      <div className="relative flex h-full items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-2 text-sm leading-6 text-[#f0c8ea]">{description}</p>
          <p className="mt-4 text-[10px] uppercase tracking-[0.24em] text-[#8beeff]">{detail}</p>
        </div>
        <span className="rounded-full border border-[rgba(57,230,255,0.16)] bg-[rgba(57,230,255,0.08)] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#8ceeff]">
          Open
        </span>
      </div>
    </Link>
  );
}

function LabeledField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d6afd7]">{label}</div>
      {children}
    </label>
  );
}
