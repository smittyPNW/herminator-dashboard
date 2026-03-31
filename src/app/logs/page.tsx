import { listLogs, listSessions } from "@/lib/hermes";
import Card from "@/components/Card";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const logs = listLogs();
  const sessions = listSessions();
  const cronSessions = sessions.filter((s) => s.isCron).slice(0, 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white glow-text">Logs</h1>
        <p className="text-[#2a3f58] text-sm mt-1">Gateway logs and cron run history</p>
      </div>

      {/* Gateway Logs */}
      <Card title="Gateway Logs">
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#2a3f58] text-sm">No log files found</p>
          </div>
        ) : (
          <div className="space-y-5">
            {logs.map((log) => (
              <div key={log.name}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[rgba(0,212,255,0.04)] border border-[rgba(0,212,255,0.06)] flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-[#2a3f58]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-sm text-[#a0aec0] font-medium">{log.name}</span>
                    <span className="text-[10px] text-[#2a3f58] font-mono">{formatSize(log.size)}</span>
                  </div>
                  <span className="text-[10px] text-[#2a3f58] font-mono">{log.modified.toLocaleString()}</span>
                </div>
                <pre className="log-terminal text-xs text-[#4a5568] rounded-xl p-4 max-h-64 overflow-auto whitespace-pre-wrap break-all leading-relaxed">
                  {log.tail || "(empty)"}
                </pre>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Cron Run History */}
      <Card title="Recent Cron Runs" noPadding>
        {cronSessions.length === 0 ? (
          <p className="text-[#2a3f58] text-sm text-center py-8 px-5">No cron session files found</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(0,212,255,0.06)]">
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-[#2a3f58] uppercase tracking-[0.15em]">Session File</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-[#2a3f58] uppercase tracking-[0.15em]">Date</th>
                  <th className="text-right px-5 py-3 text-[10px] font-semibold text-[#2a3f58] uppercase tracking-[0.15em]">Size</th>
                </tr>
              </thead>
              <tbody>
                {cronSessions.map((session) => (
                  <tr key={session.name} className="border-b border-[rgba(0,212,255,0.03)] table-row-hover">
                    <td className="px-5 py-3">
                      <a
                        href={`/sessions/${encodeURIComponent(session.name)}`}
                        className="text-xs font-mono text-[#718096] hover:text-[#00d4ff] transition-colors"
                      >
                        {session.name}
                      </a>
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
