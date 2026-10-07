import Link from "next/link";
import { Icon } from "@/components/icon";
import { getClient } from "@/lib/db-data";
import { customerJobUrl, formatDate, isOverdue, remainingLabel, statusLabel, ticketProgress } from "@/lib/tickets";
import type { Ticket } from "@/lib/types";

/** "Hero Work Order Dossier" card from the customer sample. */
export async function JobHero({ job, compact = false }: { job: Ticket; compact?: boolean }) {
  const client = (await getClient(job.clientId))!;
  const overdue = isOverdue(job);
  const done = job.status === "completed";
  const progress = ticketProgress(job);
  const customerLink = customerJobUrl(job);

  return (
    <div className="relative bg-surface-container-lowest rounded-xl shadow-md p-space-lg overflow-hidden">
      <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-surface-container opacity-40 blur-3xl pointer-events-none"></div>
      <div className="absolute right-0 top-0 w-32 h-32 bg-linear-to-bl from-safety-orange/10 via-transparent to-transparent pointer-events-none"></div>
      <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg">
        <div className="space-y-space-xs max-w-3xl">
          <div className="flex flex-wrap items-center gap-space-sm">
            <span className="px-space-sm py-0.5 rounded bg-slate-dark text-on-primary font-label-mono text-label-mono font-bold tracking-wider">
              JOB ID: #{job.jobId}
            </span>
            <div
              className={`flex items-center gap-space-xs px-space-sm py-0.5 rounded text-on-primary font-label-mono-sm text-label-mono-sm uppercase ${
                done ? "bg-slate-dark" : overdue ? "bg-error" : "bg-industrial-green-deep"
              }`}
            >
              {!done && <span className="w-2 h-2 rounded-full bg-industrial-green-bright animate-pulse"></span>}
              {done ? "Delivered" : overdue ? "Delayed" : statusLabel[job.status]}
            </div>
            <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">{job.category}</span>
          </div>
          <a
            href={customerLink}
            className="inline-flex items-center gap-1 text-[11px] font-label-mono uppercase tracking-wider text-safety-orange hover:underline"
          >
            <Icon name="link" className="text-sm" /> Shareable customer link
          </a>
          <h1 className={`${compact ? "font-headline-lg text-headline-lg" : "font-headline-xl text-headline-xl"} text-on-surface tracking-tight`}>
            {compact ? (
              <Link href={`/customer/jobs/${job.jobId}`} className="hover:text-safety-orange transition-colors">
                {job.title}
              </Link>
            ) : (
              job.title
            )}
          </h1>
          <div className="flex flex-wrap items-center gap-y-1 gap-x-space-md text-on-surface-variant font-body-md text-body-md">
            <div className="flex items-center gap-space-xs">
              <Icon name="location_on" className="text-safety-orange text-[18px]" />
              <span className="font-medium text-on-surface">{client.facility}</span>
            </div>
            <span className="text-slate-border">•</span>
            <div className="flex items-center gap-space-xs">
              <Icon name="precision_manufacturing" className="text-slate-dark text-[18px]" />
              <span>Asset {job.assetTag}</span>
            </div>
            <span className="text-slate-border">•</span>
            <div className="flex items-center gap-space-xs font-label-mono text-label-mono text-on-surface-variant">
              STARTED {formatDate(job.startDate).toUpperCase()}
            </div>
          </div>
          {compact && (
            <div className="pt-space-sm flex items-center gap-space-md max-w-xl">
              <div className="flex-1 bg-surface-container h-2 rounded-full overflow-hidden shadow-inner">
                <div className="bg-linear-to-r from-safety-orange to-safety-orange-bright h-full" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="font-label-mono text-label-mono font-bold text-slate-dark">{progress}% COMPLETE</span>
              <Link
                href={`/customer/jobs/${job.jobId}`}
                className="inline-flex items-center gap-space-xs px-space-sm py-1.5 rounded bg-slate-dark text-on-primary font-label-mono text-label-mono font-bold hover:bg-primary-container shadow-sm"
              >
                View Job <Icon name="arrow_forward" className="text-[16px] text-safety-orange-bright" />
              </Link>
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row xl:flex-col items-start sm:items-center xl:items-end justify-between gap-space-md bg-surface-container-low p-space-md rounded-lg shadow-sm">
          <div className="space-y-space-xs">
            <div className="flex items-center gap-space-xs xl:justify-end text-on-surface-variant font-label-mono-sm text-label-mono-sm uppercase font-bold tracking-wider">
              <Icon name="event" className="text-[16px] text-safety-orange" />
              <span>{done ? "Finished On" : "Finish Date"}</span>
            </div>
            <div className="font-headline-lg text-headline-lg text-slate-dark tracking-tight xl:text-right">{formatDate(job.endDate).toUpperCase()}</div>
          </div>
          <div
            className={`flex items-center gap-space-xs px-space-sm py-1 rounded text-on-primary shadow-sm font-label-mono text-label-mono font-bold ${
              done ? "bg-industrial-green" : overdue ? "bg-error" : "bg-safety-orange"
            }`}
          >
            <Icon name={done ? "task_alt" : "timelapse"} className={`text-[16px] ${done ? "" : "animate-spin"}`} />
            <span>{done ? "COMPLETED" : `${remainingLabel(job).toUpperCase()} • ${overdue ? "DELAYED" : "ON SCHEDULE"}`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
