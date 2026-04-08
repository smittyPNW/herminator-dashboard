import Link from "next/link";
import type { ReactNode } from "react";
import {
  getHermesFleetSummary,
  listCronJobsAcrossInstances,
  listHermesInstances,
  listPlatformConnectionsAcrossInstances,
  listSessionsAcrossInstances,
  listSkills,
  type PlatformConnectionInfo,
  readGatewayState,
} from "@/lib/hermes";
import Card from "@/components/Card";
import StatusBadge from "@/components/StatusBadge";
import WeatherWidget from "@/components/WeatherWidget";
import GatewayControls from "@/components/GatewayControls";
import QuickActionsPanel from "@/components/QuickActionsPanel";
import InstancesPanel from "@/components/InstancesPanel";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const gateway = readGatewayState();
  const fleet = getHermesFleetSummary();
  const cronJobs = listCronJobsAcrossInstances();
  const instances = listHermesInstances();
  const platformConnections = listPlatformConnectionsAcrossInstances();
  const skills = listSkills();
  const sessions = listSessionsAcrossInstances();

  const totalSkills = skills.reduce((acc, cat) => acc + cat.skills.length, 0);
  const activeJobs = cronJobs.filter((j) => j.status === "active").length;
  const cronSessions = sessions.filter((s) => s.isCron).length;
  const recentSessions = sessions.slice(0, 8);
  const featuredJobs = cronJobs.slice(0, 5);
  const skillSpotlight = skills
    .slice(0, 7)
    .map((cat, index) => ({
      name: cat.name,
      count: cat.skills.length,
      height: 34 + ((cat.skills.length || index + 2) % 7) * 12,
    }));

  const stats = [
    {
      label: "Fleet",
      value: fleet.state,
      sub:
        fleet.totalInstances > 0
          ? `${fleet.runningInstances}/${fleet.totalInstances} runtimes live`
          : "Awaiting runtime discovery",
      variant: "status" as const,
      icon: <CircuitGlyph />,
    },
    {
      label: "Cron Jobs",
      value: `${activeJobs}`,
      sub: `${cronJobs.length} total across ${instances.length} runtimes`,
      variant: "metric" as const,
      icon: <MiniBars colorA="#74f5ff" colorB="#5f8bff" />,
    },
    {
      label: "Skills",
      value: `${totalSkills}`,
      sub: `${skills.length} categories`,
      variant: "metric" as const,
      icon: <MiniBars colorA="#ffbe66" colorB="#ff4fd8" />,
    },
    {
      label: "Sessions",
      value: `${sessions.length}`,
      sub: `${cronSessions} cron runs across the fleet`,
      variant: "metric" as const,
      icon: <MiniBars colorA="#39e6ff" colorB="#ff6be9" tall />,
    },
  ];

  return (
    <div className="dashboard-main pb-10">
      <div className="hero-haze" />

      <div className="page-shell relative z-10 space-y-6">
        <div className="fade-in rounded-full border border-[rgba(57,230,255,0.2)] bg-[rgba(15,5,27,0.58)] px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#eec8ea] shadow-[inset_0_0_24px_rgba(57,230,255,0.05)]">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#59f2a3] shadow-[0_0_10px_rgba(89,242,163,0.9)]" />
              Herminator Operator Dashboard
            </span>
            <span>Realtime Hermes Surface</span>
            <span>{fleet.runningInstances}/{fleet.totalInstances} Instances Live</span>
            <span>{fleet.totalJobs} Scheduled Jobs</span>
            <span className="text-[#7aefff]">Neon Deck Online</span>
          </div>
        </div>

        <header className="fade-in relative overflow-hidden rounded-[32px] border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(135deg,rgba(28,10,44,0.76),rgba(11,4,21,0.68))] px-6 py-7 shadow-[0_24px_90px_rgba(9,2,18,0.34)] xl:flex xl:items-end xl:justify-between xl:gap-6">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(57,230,255,0.06),transparent_35%,rgba(255,79,216,0.08)),repeating-linear-gradient(180deg,rgba(255,255,255,0.04)_0_1px,transparent_1px_5px)] opacity-35" />
          <div className="absolute right-8 top-4 h-20 w-52 rounded-full bg-[radial-gradient(circle,rgba(57,230,255,0.18),transparent_70%)] blur-2xl" />
          <div className="max-w-3xl">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.42em] text-[#ffcaef]">Dashboard</p>
            <h1 className="headline-display glow-text text-4xl font-black text-white md:text-5xl">
              Herminator Control Center
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#f6c8ea]">
              Live gateway health, cron activity, skills, and sessions in one operating view.
            </p>
          </div>
          <div className="relative mt-5 xl:mt-0">
            <GatewayControls initialState={gateway?.gateway_state || "unknown"} />
          </div>
        </header>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.24fr_1fr_1fr]">
          <div className="fade-in fade-in-delay-1 xl:row-span-2">
            <WeatherWidget />
          </div>

          {stats.map((stat, index) => (
            <StatPanel
              key={stat.label}
              label={stat.label}
              value={stat.value}
              sub={stat.sub}
              variant={stat.variant}
              icon={stat.icon}
              delayClass={`fade-in-delay-${Math.min(index + 1, 4)}`}
            />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.16fr_1fr]">
          <Card title="Platform Status" className="fade-in fade-in-delay-1 min-h-[360px]">
            <PlatformMatrix connections={platformConnections} />
          </Card>

          <div className="space-y-5">
            <Card
              title="Active Cron Jobs"
              action={<Link href="/cron" className="text-xs text-[#8beeff] hover:text-white">View all -&gt;</Link>}
              className="fade-in fade-in-delay-2 min-h-[360px]"
            >
              <JobShowcase jobs={featuredJobs} />
            </Card>

            <div className="fade-in fade-in-delay-3 synth-panel p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="card-title">Signal Rack</div>
                  <p className="mt-2 text-sm text-[#f4c3e6]">A compact live view of the hottest cron lanes.</p>
                </div>
                <span className="rounded-full border border-[rgba(255,255,255,0.12)] px-3 py-1 text-xs text-[#7aefff]">
                  {featuredJobs.length || 0} live
                </span>
              </div>
              <div className="space-y-3">
                {featuredJobs.length === 0 ? (
                  <p className="text-sm text-[#f7d0ef]">Waiting for scheduled jobs.</p>
                ) : (
                  featuredJobs.map((job) => (
                    <div
                      key={`${job.id}-rack`}
                      className="flex items-center justify-between rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(90deg,rgba(11,4,21,0.72),rgba(29,10,49,0.72))] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{job.name}</p>
                        <p className="mt-1 text-[11px] text-[#d5b0dd]">{job.repeat || job.schedule}</p>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="fade-in fade-in-delay-4">
          <Card
            title="Instances & Sidecars"
            action={<Link href="/config" className="text-xs text-[#8beeff] hover:text-white">Runtime matrix -&gt;</Link>}
          >
            <InstancesPanel instances={instances} />
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <Card
            title="Skill Spectrum"
            action={<Link href="/skills" className="text-xs text-[#8beeff] hover:text-white">View all -&gt;</Link>}
            className="fade-in fade-in-delay-1"
          >
            <SkillSpectrum totalSkills={totalSkills} skills={skillSpotlight} />
          </Card>

          <Card
            title="Recent Sessions"
            action={<Link href="/sessions" className="text-xs text-[#8beeff] hover:text-white">View all -&gt;</Link>}
            className="fade-in fade-in-delay-2"
          >
            <SessionDeck sessions={recentSessions} />
          </Card>
        </section>

        <section className="fade-in fade-in-delay-3">
          <QuickActionsPanel />
        </section>
      </div>
    </div>
  );
}

function StatPanel({
  label,
  value,
  sub,
  variant,
  icon,
  delayClass,
}: {
  label: string;
  value: string;
  sub: string;
  variant: "status" | "metric";
  icon: ReactNode;
  delayClass: string;
}) {
  return (
    <section className={`fade-in ${delayClass} synth-panel min-h-[154px] p-5`}>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,79,216,0.06),transparent_35%,rgba(57,230,255,0.06))]" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="card-title">{label}</div>
            <div className="mt-5">
              {variant === "status" ? (
                <StatusBadge status={value} size="lg" />
              ) : (
                <p className="text-5xl font-black leading-none text-white">{value}</p>
              )}
            </div>
          </div>
          <div className="min-w-[124px]">{icon}</div>
        </div>
        <p className="mt-3 text-sm text-[#f6c9e9]">{sub}</p>
      </div>
    </section>
  );
}

function PlatformMatrix({
  connections,
}: {
  connections: PlatformConnectionInfo[];
}) {
  if (connections.length === 0) {
    return <p className="text-sm text-[#f7d0ef]">No platform data available.</p>;
  }

  const telegramConnections = connections.filter((connection) => connection.platform === "telegram");
  const connectedTelegramCount = telegramConnections.filter((connection) => connection.state === "connected").length;
  const issueCount = connections.filter((connection) => connection.hasError).length;

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-[rgba(57,230,255,0.14)] bg-[linear-gradient(180deg,rgba(10,3,19,0.65),rgba(18,5,30,0.72))] p-4">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.06)_0_1px,transparent_1px_26px),linear-gradient(transparent_62%,rgba(57,230,255,0.14)_62%,rgba(57,230,255,0.24)_63%,transparent_64%)] opacity-35" />
      <div className="relative mb-4 flex flex-wrap gap-2">
        <span className="badge-pill bg-[rgba(57,230,255,0.08)] text-[#8defff] border-[rgba(57,230,255,0.18)]">
          {connectedTelegramCount}/{telegramConnections.length || 0} telegram live
        </span>
        <span className="badge-pill bg-[rgba(255,79,216,0.08)] text-[#ffd0ef] border-[rgba(255,79,216,0.18)]">
          {connections.length} adapters
        </span>
        {issueCount > 0 && (
          <span className="badge-pill bg-[rgba(255,132,121,0.12)] text-[#ffb6b6] border-[rgba(255,132,121,0.22)]">
            {issueCount} issue{issueCount === 1 ? "" : "s"}
          </span>
        )}
      </div>
      <div className="relative space-y-3">
        {connections.map((connection) => (
          <div
            key={`${connection.instance}:${connection.platform}`}
            className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(18,8,33,0.45)] px-3 py-3 backdrop-blur-sm"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(57,230,255,0.18)] bg-[rgba(57,230,255,0.08)] text-xs font-black uppercase text-[#9cf6ff]">
              {connection.platform.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-base font-semibold text-white">{connection.platform}</p>
                <span className="badge-pill bg-[rgba(255,79,216,0.08)] text-[#ffd0ef] border-[rgba(255,79,216,0.18)] text-[10px]">
                  {connection.instance}
                </span>
              </div>
              <p className="mt-1 text-xs text-[#d7b3de]">
                {connection.updatedAt ? new Date(connection.updatedAt).toLocaleString() : "No timestamp"}
              </p>
              {connection.detail && (
                <p className={`mt-1 text-[11px] uppercase tracking-[0.14em] ${
                  connection.hasError ? "text-[#ffb6b6]" : "text-[#98efff]"
                }`}>
                  {connection.detail}
                </p>
              )}
            </div>
            <StatusBadge status={connection.state} />
          </div>
        ))}
      </div>
    </div>
  );
}

function JobShowcase({ jobs }: { jobs: ReturnType<typeof listCronJobsAcrossInstances> }) {
  if (jobs.length === 0) {
    return <p className="text-sm text-[#f7d0ef]">No cron jobs configured.</p>;
  }

  return (
    <div className="space-y-4">
      {jobs.map((job, index) => (
        <div
          key={job.id}
          className="relative overflow-hidden rounded-[24px] border border-[rgba(255,122,227,0.34)] bg-[radial-gradient(circle_at_70%_22%,rgba(57,230,255,0.2),transparent_34%),linear-gradient(180deg,rgba(33,11,52,0.92),rgba(11,4,21,0.96))] px-4 py-4 shadow-[inset_0_0_28px_rgba(57,230,255,0.05)]"
        >
          <div className="absolute inset-x-3 top-3 h-px bg-[rgba(255,255,255,0.08)]" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-[#7aefff]">Lane {index + 1}</div>
              <p className="truncate text-lg font-semibold text-white">{job.name}</p>
              <p className="mt-1 text-xs text-[#ffd7f3]">{job.repeat || job.schedule}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-[#d5b0dd]">
                <span className="rounded-full border border-[rgba(57,230,255,0.18)] bg-[rgba(57,230,255,0.08)] px-2 py-0.5 text-[#91efff]">
                  {job.instance}
                </span>
                <span>{job.schedule}</span>
                {job.nextRun && <span>Next: {job.nextRun}</span>}
              </div>
            </div>
            <StatusBadge status={job.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkillSpectrum({
  totalSkills,
  skills,
}: {
  totalSkills: number;
  skills: Array<{ name: string; count: number; height: number }>;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-5xl font-black leading-none text-white">{totalSkills}</p>
          <p className="mt-2 text-sm text-[#f6c8ea]">Skill modules available across the Hermes stack.</p>
        </div>
        <div className="rounded-full border border-[rgba(255,255,255,0.12)] px-3 py-1 text-xs text-[#7aefff]">
          Signal Density
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(13,3,25,0.72),rgba(24,8,41,0.92))] p-4">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(to_right,rgba(255,255,255,0.06)_0_1px,transparent_1px_48px),repeating-linear-gradient(to_bottom,rgba(255,255,255,0.04)_0_1px,transparent_1px_32px)] opacity-20" />
        <div className="relative flex h-[220px] items-end justify-between gap-3">
          {skills.map((skill, index) => (
            <div key={skill.name} className="flex flex-1 flex-col items-center justify-end gap-3">
              <div
                className="w-full rounded-t-xl border border-[rgba(255,255,255,0.14)]"
                style={{
                  height: `${skill.height}px`,
                  background: `linear-gradient(180deg, ${
                    index % 2 === 0 ? "#ffb96c" : "#55f0ff"
                  } 0%, #ff4fd8 100%)`,
                  boxShadow: "0 0 24px rgba(255,79,216,0.18)",
                }}
              />
              <div className="text-center">
                <p className="truncate text-xs font-semibold text-white">{skill.name}</p>
                <p className="mt-1 text-[11px] text-[#d6b0de]">{skill.count}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SessionDeck({ sessions }: { sessions: ReturnType<typeof listSessionsAcrossInstances> }) {
  if (sessions.length === 0) {
    return <p className="text-sm text-[#f7d0ef]">No recent sessions found.</p>;
  }

  return (
    <div className="space-y-3">
      {sessions.map((session, index) => (
        <Link
          key={`${session.homeDir}:${session.name}`}
          href={`/sessions/${encodeURIComponent(session.name)}?home=${encodeURIComponent(session.homeDir)}`}
          className="group flex items-center justify-between gap-4 rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(90deg,rgba(18,8,33,0.86),rgba(43,12,67,0.66))] px-4 py-4 hover:border-[rgba(57,230,255,0.24)]"
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(57,230,255,0.18)] bg-[rgba(57,230,255,0.08)] text-sm font-black text-[#87f4ff]">
              {index + 1}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white group-hover:text-[#98f4ff]">{session.name}</p>
              <p className="mt-1 text-xs text-[#f6c8ea]">
                {session.instance} · {session.date.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-[#d6b0de]">
            <div className="uppercase tracking-[0.18em]">{session.isCron ? "cron" : "session"}</div>
            <div className="mt-1">{formatSize(session.size)}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function MiniBars({
  colorA,
  colorB,
  tall = false,
}: {
  colorA: string;
  colorB: string;
  tall?: boolean;
}) {
  const heights = tall ? [44, 26, 58, 36, 72, 52, 66, 40] : [26, 38, 30, 56, 42, 20];

  return (
    <div className="flex h-[74px] items-end justify-end gap-2 pt-2">
      {heights.map((height, index) => (
        <span
          key={`${height}-${index}`}
          className="w-5 rounded-t-md border border-[rgba(255,255,255,0.1)]"
          style={{
            height,
            background: `linear-gradient(180deg, ${colorA} 0%, ${colorB} 100%)`,
            boxShadow: `0 0 16px ${colorA}55`,
          }}
        />
      ))}
    </div>
  );
}

function CircuitGlyph() {
  return (
    <div className="rounded-2xl border border-[rgba(57,230,255,0.2)] bg-[linear-gradient(180deg,rgba(57,230,255,0.1),rgba(57,230,255,0.04))] p-3 text-[#7befff] shadow-[inset_0_0_18px_rgba(57,230,255,0.06)]">
      <svg className="h-12 w-24" fill="none" viewBox="0 0 96 48" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" d="M4 24h24l8-10h20l8 10h28" />
        <path strokeLinecap="round" d="M20 24v12h20" />
        <path strokeLinecap="round" d="M56 14V4h20" />
        <circle cx="20" cy="24" r="3" fill="currentColor" stroke="none" />
        <circle cx="56" cy="14" r="3" fill="currentColor" stroke="none" />
        <circle cx="84" cy="24" r="3" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
