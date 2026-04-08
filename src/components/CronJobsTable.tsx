"use client";

import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";

interface CronJob {
  id: string;
  name: string;
  status: string;
  schedule: string;
  repeat: string;
  nextRun: string;
  deliver: string;
  skills: string[];
  instance: string;
  homeDir: string;
}

export default function CronJobsTable({ jobs }: { jobs: CronJob[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [, startTransition] = useTransition();

  async function act(jobId: string, homeDir: string, verb: "pause" | "resume" | "run" | "remove") {
    setBusyId(`${jobId}:${verb}`);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cronAction", jobId, verb, homeDir }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || data.message || "Cron action failed");
        return;
      }
      setMessage(data.message || "Cron action complete");
      startTransition(() => router.refresh());
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-4">
      {(message || error) && (
        <div className={`rounded-2xl px-4 py-3 text-sm ${error ? "border border-[rgba(255,132,121,0.35)] bg-[rgba(88,27,29,0.48)] text-[#ffd0d0]" : "border border-[rgba(89,242,163,0.35)] bg-[rgba(23,73,53,0.35)] text-[#c9ffe0]"}`}>
          {error || message}
        </div>
      )}

      <div className="overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.08)]">
              <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d7b3de]">Name</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d7b3de]">ID</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d7b3de]">Status</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d7b3de]">Instance</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d7b3de]">Schedule</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d7b3de]">Deliver</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d7b3de]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-[rgba(255,255,255,0.05)] align-top">
                <td className="px-5 py-4">
                  <div className="min-w-[180px]">
                    <div className="text-sm font-semibold text-white">{job.name}</div>
                    <div className="mt-1 text-xs text-[#d6b0de]">{formatNextRun(job.nextRun)}</div>
                    {job.skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {job.skills.map((skill) => (
                          <span key={skill} className="rounded-full border border-[rgba(57,230,255,0.18)] bg-[rgba(57,230,255,0.07)] px-2 py-0.5 text-[10px] text-[#8defff]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(11,4,21,0.38)] px-2 py-1 font-mono text-xs text-[#d6b0de]">
                    {job.id}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={job.status} />
                </td>
                <td className="px-5 py-4 text-sm text-[#f0c8ea]">
                  <span className="rounded-full border border-[rgba(57,230,255,0.18)] bg-[rgba(57,230,255,0.07)] px-2.5 py-1 text-[11px] text-[#8defff]">
                    {job.instance}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-[#f0c8ea]">
                  <div>{job.schedule}</div>
                  {job.repeat && <div className="mt-1 text-xs text-[#d6b0de]">{job.repeat}</div>}
                </td>
                <td className="px-5 py-4 text-sm text-[#f0c8ea]">{job.deliver || "origin"}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {job.status === "active" ? (
                      <ActionButton onClick={() => act(job.id, job.homeDir, "pause")} busy={busyId === `${job.id}:pause`}>
                        Pause
                      </ActionButton>
                    ) : (
                      <ActionButton onClick={() => act(job.id, job.homeDir, "resume")} busy={busyId === `${job.id}:resume`}>
                        Resume
                      </ActionButton>
                    )}
                    <ActionButton onClick={() => act(job.id, job.homeDir, "run")} busy={busyId === `${job.id}:run`}>
                      Run Now
                    </ActionButton>
                    <button
                      onClick={() => act(job.id, job.homeDir, "remove")}
                      disabled={Boolean(busyId)}
                      className="btn-danger px-3 py-2 text-xs disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  busy,
  children,
}: {
  onClick: () => void;
  busy: boolean;
  children: ReactNode;
}) {
  return (
    <button onClick={onClick} disabled={busy} className="btn-neon px-3 py-2 text-xs disabled:opacity-40">
      {busy ? "Working..." : children}
    </button>
  );
}

function formatNextRun(dateStr: string): string {
  if (!dateStr) return "No next run";
  try {
    const d = new Date(dateStr);
    return `Next ${d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}`;
  } catch {
    return dateStr;
  }
}
