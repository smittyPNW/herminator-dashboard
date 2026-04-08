import { listHermesInstances, listSessionsAcrossInstances } from "@/lib/hermes";
import Card from "@/components/Card";
import Link from "next/link";
import PageHero from "@/components/PageHero";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const sessions = listSessionsAcrossInstances();
  const instances = listHermesInstances();
  const cronSessions = sessions.filter((s) => s.isCron);
  const regularSessions = sessions.filter((s) => !s.isCron);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Sessions"
        title="Conversation and cron replay"
        description="Browse live session files across Hermes and every sidecar without guessing which home directory owns the thread."
        stats={
          <>
            <span className="badge-pill bg-[rgba(0,212,255,0.06)] text-[#00d4ff] border-[rgba(0,212,255,0.15)]">
              {sessions.length} total
            </span>
            <span className="badge-pill bg-emerald-500/8 text-emerald-400 border-emerald-500/15">
              {regularSessions.length} regular
            </span>
            <span className="badge-pill bg-[rgba(251,191,36,0.06)] text-[#fbbf24] border-[rgba(251,191,36,0.15)]">
              {cronSessions.length} cron
            </span>
            <span className="badge-pill bg-[rgba(255,79,216,0.08)] text-[#ffd0ef] border-[rgba(255,79,216,0.18)]">
              {instances.length} instances
            </span>
          </>
        }
      />

      <div className="flex gap-3">
        <span className="badge-pill bg-[rgba(0,212,255,0.06)] text-[#00d4ff] border-[rgba(0,212,255,0.15)]">
          All: {sessions.length}
        </span>
        <span className="badge-pill bg-emerald-500/8 text-emerald-400 border-emerald-500/15">
          Regular: {regularSessions.length}
        </span>
        <span className="badge-pill bg-[rgba(251,191,36,0.06)] text-[#fbbf24] border-[rgba(251,191,36,0.15)]">
          Cron: {cronSessions.length}
        </span>
      </div>

      <Card noPadding>
        {sessions.length === 0 ? (
          <p className="text-[#2a3f58] text-center py-8 px-5">No session files found</p>
        ) : (
          <div className="overflow-auto max-h-[700px]">
            <table className="w-full">
              <thead className="sticky top-0 bg-[#0d1420]/95 backdrop-blur-sm z-10">
                <tr className="border-b border-[rgba(0,212,255,0.06)]">
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-[#2a3f58] uppercase tracking-[0.15em]">Filename</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-[#2a3f58] uppercase tracking-[0.15em]">Instance</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-[#2a3f58] uppercase tracking-[0.15em]">Type</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-[#2a3f58] uppercase tracking-[0.15em]">Date</th>
                  <th className="text-right px-5 py-3 text-[10px] font-semibold text-[#2a3f58] uppercase tracking-[0.15em]">Size</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={`${session.homeDir}:${session.name}`} className="border-b border-[rgba(0,212,255,0.03)] table-row-hover group">
                    <td className="px-5 py-3">
                      <Link
                        href={`/sessions/${encodeURIComponent(session.name)}?home=${encodeURIComponent(session.homeDir)}`}
                        className="text-xs font-mono text-[#718096] group-hover:text-[#00d4ff] transition-colors"
                      >
                        {session.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className="badge-pill bg-[rgba(255,79,216,0.08)] text-[#ffd0ef] border-[rgba(255,79,216,0.18)] text-[10px]">
                        {session.instance}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {session.isCron ? (
                        <span className="badge-pill bg-[rgba(251,191,36,0.06)] text-[#fbbf24] border-[rgba(251,191,36,0.15)] text-[10px]">cron</span>
                      ) : (
                        <span className="badge-pill bg-emerald-500/8 text-emerald-400 border-emerald-500/15 text-[10px]">session</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-[#4a5568] font-mono">{session.date.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-xs text-[#2a3f58] font-mono">{formatSize(session.size)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
