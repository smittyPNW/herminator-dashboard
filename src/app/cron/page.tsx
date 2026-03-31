import { listCronJobs } from "@/lib/hermes";
import Card from "@/components/Card";
import CronJobsTable from "@/components/CronJobsTable";
import PageHero from "@/components/PageHero";

export const dynamic = "force-dynamic";

export default async function CronPage() {
  const jobs = listCronJobs();
  const activeCount = jobs.filter((j) => j.status === "active").length;
  const pausedCount = jobs.filter((j) => j.status === "paused").length;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Cron"
        title="Hermes scheduler control"
        description="Operate the live schedule grid with high-confidence actions instead of shell hopping."
        stats={
          <>
            <span className="rounded-full border border-[rgba(89,242,163,0.28)] bg-[rgba(23,73,53,0.34)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#bdfdd8]">
              {activeCount} active
            </span>
            {pausedCount > 0 && (
              <span className="rounded-full border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.08)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#ffd39f]">
                {pausedCount} paused
              </span>
            )}
            <span className="rounded-full border border-[rgba(57,230,255,0.15)] bg-[rgba(57,230,255,0.06)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#8ceeff]">
              {jobs.length} total jobs
            </span>
          </>
        }
      />

      {jobs.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(0,212,255,0.03)] border border-[rgba(0,212,255,0.08)] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#1e2d40]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[#f0c8ea] text-sm">No cron jobs configured</p>
            <p className="text-[#d6b0de] text-xs mt-1">Use the dashboard quick-create panel or <code className="rounded bg-[rgba(0,212,255,0.08)] px-1.5 py-0.5 text-[#8ceeff]">hermes cron create</code>.</p>
          </div>
        </Card>
      ) : (
        <Card noPadding>
          <CronJobsTable jobs={jobs} />
        </Card>
      )}
    </div>
  );
}
