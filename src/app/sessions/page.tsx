import { listSessions } from "@/lib/hermes";
import Card from "@/components/Card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const sessions = listSessions();
  const cronSessions = sessions.filter((s) => s.isCron);
  const regularSessions = sessions.filter((s) => !s.isCron);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white glow-text">Sessions</h1>
        <p className="text-[#2a3f58] text-sm mt-1">
          {sessions.length} total sessions ({cronSessions.length} cron, {regularSessions.length} regular)
        </p>
      </div>

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
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-[#2a3f58] uppercase tracking-[0.15em]">Type</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-[#2a3f58] uppercase tracking-[0.15em]">Date</th>
                  <th className="text-right px-5 py-3 text-[10px] font-semibold text-[#2a3f58] uppercase tracking-[0.15em]">Size</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.name} className="border-b border-[rgba(0,212,255,0.03)] table-row-hover group">
                    <td className="px-5 py-3">
                      <Link
                        href={`/sessions/${encodeURIComponent(session.name)}`}
                        className="text-xs font-mono text-[#718096] group-hover:text-[#00d4ff] transition-colors"
                      >
                        {session.name}
                      </Link>
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
