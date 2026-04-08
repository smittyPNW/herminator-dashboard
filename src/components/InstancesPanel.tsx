import StatusBadge from "@/components/StatusBadge";
import type { HermesInstanceInfo } from "@/lib/hermes";

export default function InstancesPanel({ instances }: { instances: HermesInstanceInfo[] }) {
  if (instances.length === 0) {
    return <p className="text-sm text-[#f7d0ef]">No Hermes instances discovered.</p>;
  }

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {instances.map((instance) => (
        <div
          key={instance.homeDir}
          className="operator-tile p-4"
        >
          <div className="relative flex h-full flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-white">{instance.primary ? "Hermes" : instance.name}</p>
                  {instance.primary && (
                    <span className="rounded-full border border-[rgba(89,242,163,0.28)] bg-[rgba(23,73,53,0.34)] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-[#bdfdd8]">
                      primary
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-[#f0c8ea]">
                  {instance.provider !== "—" ? `${instance.provider} / ` : ""}{instance.model}
                </p>
                <p className="mt-1 text-xs text-[#d6b0de]">
                  {instance.cronJobCount} cron jobs · {instance.sessionCount} sessions · {instance.skillCount} skills
                </p>
              </div>
              <StatusBadge status={instance.gateway} />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Metric label="Active Jobs" value={String(instance.activeCronCount)} />
              <Metric label="Platforms" value={String(instance.platformCount)} />
              <Metric label="PID" value={instance.pid ? String(instance.pid) : "—"} />
            </div>

            <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(8,3,18,0.38)] px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.26em] text-[#d6afd7]">Hermes Home</p>
              <p className="mt-2 truncate font-mono text-xs text-[#9cefff]">{instance.homeDir}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[#d6b0de]">
                Gateway state: <span className="text-[#f5d5ef]">{instance.gatewayState}</span>
              </p>
              {instance.updatedAt && (
                <p className="mt-1 text-[11px] text-[#d6b0de]">
                  Updated {new Date(instance.updatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(8,3,18,0.38)] px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.22em] text-[#d6afd7]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
