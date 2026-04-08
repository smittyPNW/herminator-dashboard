import { listHermesInstances, readConfig, readEnvVars } from "@/lib/hermes";
import Card from "@/components/Card";
import PageHero from "@/components/PageHero";
import InstancesPanel from "@/components/InstancesPanel";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const config = readConfig();
  const envVars = readEnvVars();
  const instances = listHermesInstances();

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Configuration"
        title="Hermes configuration matrix"
        description="Profiles, runtime wiring, environment values, and full configuration inspection on one surface."
        stats={
          <>
            <span className="rounded-full border border-[rgba(57,230,255,0.15)] bg-[rgba(57,230,255,0.06)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#8ceeff]">
              {envVars.length} env vars
            </span>
            <span className="rounded-full border border-[rgba(255,79,216,0.18)] bg-[rgba(255,79,216,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#ffd0ef]">
              profiles and runtime
            </span>
            <span className="rounded-full border border-[rgba(89,242,163,0.28)] bg-[rgba(23,73,53,0.34)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#bdfdd8]">
              {instances.length} instances
            </span>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Instances & Sidecars" className="lg:col-span-2">
          <InstancesPanel instances={instances} />
        </Card>

        {/* Agent Settings */}
        <Card title="Agent Settings">
          {config ? (
            <div className="space-y-1">
              <ConfigRow label="Default Model" value={String((config.model as Record<string, unknown>)?.default || "N/A")} highlight />
              <ConfigRow label="Provider" value={String((config.model as Record<string, unknown>)?.provider || "N/A")} />
              <ConfigRow label="Max Turns" value={String((config.agent as Record<string, unknown>)?.max_turns || "N/A")} />
              <ConfigRow label="Reasoning Effort" value={String((config.agent as Record<string, unknown>)?.reasoning_effort || "N/A")} />
              <ConfigRow label="Personality" value={String((config.display as Record<string, unknown>)?.personality || "N/A")} highlight />
              <ConfigRow label="Streaming" value={String((config.streaming as Record<string, unknown>)?.enabled ?? "N/A")} />
              <ConfigRow label="Compression" value={String((config.compression as Record<string, unknown>)?.enabled ?? "N/A")} />
              <ConfigRow label="Compression Model" value={String((config.compression as Record<string, unknown>)?.summary_model || "N/A")} />
              <ConfigRow label="Memory Enabled" value={String((config.memory as Record<string, unknown>)?.memory_enabled ?? "N/A")} />
              <ConfigRow label="Approvals Mode" value={String((config.approvals as Record<string, unknown>)?.mode || "N/A")} />
              <ConfigRow label="STT Provider" value={String((config.stt as Record<string, unknown>)?.provider || "N/A")} />
              <ConfigRow label="TTS Provider" value={String((config.tts as Record<string, unknown>)?.provider || "N/A")} />
            </div>
          ) : (
            <p className="text-[#d6b0de] text-sm">Unable to read config</p>
          )}
        </Card>

        {/* Terminal Settings */}
        <Card title="Terminal & Execution">
          {config ? (
            <div className="space-y-1">
              <ConfigRow label="Terminal Backend" value={String((config.terminal as Record<string, unknown>)?.backend || "N/A")} highlight />
              <ConfigRow label="Persistent Shell" value={String((config.terminal as Record<string, unknown>)?.persistent_shell ?? "N/A")} />
              <ConfigRow label="Timeout" value={`${(config.terminal as Record<string, unknown>)?.timeout || "N/A"}s`} />
              <ConfigRow label="Code Exec Timeout" value={`${(config.code_execution as Record<string, unknown>)?.timeout || "N/A"}s`} />
              <ConfigRow label="Max Tool Calls" value={String((config.code_execution as Record<string, unknown>)?.max_tool_calls || "N/A")} />
              <ConfigRow label="Checkpoints" value={String((config.checkpoints as Record<string, unknown>)?.enabled ?? "N/A")} />
              <ConfigRow label="Redact Secrets" value={String((config.security as Record<string, unknown>)?.redact_secrets ?? "N/A")} />
              <ConfigRow label="Telegram Channel" value={String(config.TELEGRAM_HOME_CHANNEL || "N/A")} />
            </div>
          ) : (
            <p className="text-[#d6b0de] text-sm">Unable to read config</p>
          )}
        </Card>

        {/* Env Variables */}
        <Card title="Environment Variables" className="lg:col-span-2">
          {envVars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {envVars.map((v) => (
                <div key={v.key} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[rgba(0,212,255,0.015)] border border-[rgba(0,212,255,0.04)] hover:border-[rgba(0,212,255,0.08)] transition-all">
                  <span className="text-xs font-mono text-[#d8afd7] font-medium">{v.key}</span>
                  <span className="text-xs font-mono text-[#f5d5ef] ml-2 truncate max-w-[200px]">{v.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#d6b0de] text-sm">No environment variables found</p>
          )}
        </Card>

        {/* Full Config Tree */}
        <Card title="Full Configuration (YAML)" className="lg:col-span-2">
          {config ? (
            <div className="max-h-[500px] overflow-auto">
              <ConfigTree data={config} depth={0} />
            </div>
          ) : (
            <p className="text-[#d6b0de] text-sm">Unable to read config</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function ConfigRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-[rgba(255,255,255,0.03)]">
      <span className="text-sm text-[#d8afd7]">{label}</span>
      <span className={`text-sm font-mono ${highlight ? "text-[#7cefff]" : "text-[#f5d5ef]"}`}>{value}</span>
    </div>
  );
}

function ConfigTree({ data, depth }: { data: unknown; depth: number }) {
  if (data === null || data === undefined) {
    return <span className="text-[#cfa9df] italic text-xs">null</span>;
  }

  if (typeof data !== "object") {
    const str = String(data);
    if (str.length > 100) {
      return <span className="text-[#7cefff]/80 text-xs font-mono">{str.substring(0, 100)}...</span>;
    }
    return <span className="text-[#7cefff]/80 text-xs font-mono">{str}</span>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-[#cfa9df] text-xs">[]</span>;
    return (
      <div className="ml-4">
        {data.map((item, i) => (
          <div key={i} className="flex items-start gap-2 py-0.5">
            <span className="mt-0.5 text-xs text-[#cfa9df]">-</span>
            <ConfigTree data={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }

  const entries = Object.entries(data as Record<string, unknown>);
  if (entries.length === 0) return <span className="text-[#cfa9df] text-xs">{"{}"}</span>;

  return (
    <div className={depth > 0 ? "ml-4" : ""}>
      {entries.map(([key, val]) => {
        const isNested = val !== null && typeof val === "object";
        return (
          <div key={key} className="py-0.5">
            <span className="text-xs font-mono font-semibold text-[#f6d5ef]">{key}</span>
            {isNested ? (
              <>
                <span className="text-xs text-[#cfa9df]">:</span>
                <ConfigTree data={val} depth={depth + 1} />
              </>
            ) : (
              <>
                <span className="text-xs text-[#cfa9df]">: </span>
                <ConfigTree data={val} depth={depth + 1} />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
