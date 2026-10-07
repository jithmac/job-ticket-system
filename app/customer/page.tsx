import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { currentClientId, getTicketsForClient } from "@/lib/db-data";
import { formatDate } from "@/lib/tickets";
import { JobHero } from "./_components/job-hero";

export const metadata: Metadata = { title: "Your Jobs" };

export default async function CustomerJobsPage() {
  const jobs = await getTicketsForClient(currentClientId);
  const active = jobs.filter((j) => j.status !== "completed").sort((a, b) => a.endDate.localeCompare(b.endDate));
  const past = jobs.filter((j) => j.status === "completed");

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="space-y-space-xs">
          <div className="flex items-center gap-space-xs text-safety-orange font-label-mono-sm text-label-mono-sm uppercase font-bold tracking-wider">
            <Icon name="engineering" className="text-[16px]" />
            <span>Active Deployments</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight uppercase">Your Jobs</h2>
        </div>
        <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container text-on-surface-variant font-label-mono-sm text-label-mono-sm">
          <span className="w-2 h-2 rounded-full bg-industrial-green-bright animate-pulse"></span>
          <span>
            {active.length} ACTIVE CONTRACT{active.length === 1 ? "" : "S"} IN PROGRESS
          </span>
        </div>
      </div>

      {active.map((job) => (
        <JobHero key={job.id} job={job} compact />
      ))}

      {past.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg space-y-space-md">
          <div>
            <div className="flex items-center gap-space-xs text-safety-orange font-label-mono-sm text-label-mono-sm uppercase font-bold">
              <Icon name="history" className="text-[16px]" />
              <span>Service History</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Completed Jobs</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
            {past.map((job) => (
              <Link
                key={job.id}
                href={`/customer/jobs/${job.jobId}`}
                className="w-full flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low hover:bg-surface text-left transition-colors shadow-sm group"
              >
                <div className="flex items-center gap-space-sm min-w-0">
                  <div className="p-2 rounded bg-industrial-green text-on-primary shrink-0">
                    <Icon name="task_alt" className="text-[20px]" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-headline-sm text-headline-sm text-on-surface group-hover:text-industrial-green transition-colors truncate">
                      {job.title}
                    </div>
                    <div className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                      #{job.jobId} • Finished {formatDate(job.endDate)}
                    </div>
                  </div>
                </div>
                <Icon name="chevron_right" className="text-on-surface-variant group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
