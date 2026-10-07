import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { careAgent, currentClientId } from "@/lib/data";
import {
  billTotals,
  employeeStatusLabel,
  formatDate,
  formatDateTime,
  formatMoney,
  getClient,
  getTicketByPublicToken,
  getTicketByJobId,
  phaseLabel,
  ticketCrew,
  ticketProgress,
  ticketsForClient,
} from "@/lib/tickets";
import { DocumentsHub } from "../../_components/documents-hub";
import { JobHero } from "../../_components/job-hero";

/** Customers only ever get pages for their own jobs. */
export function generateStaticParams() {
  return ticketsForClient(currentClientId).flatMap((t) => [
    { jobId: t.jobId },
    { jobId: `demo-${t.jobId}` },
  ]);
}

export async function generateMetadata({ params }: PageProps<"/customer/jobs/[jobId]">): Promise<Metadata> {
  const { jobId } = await params;
  return { title: getTicketByJobId(jobId)?.title ?? jobId };
}

const lgCols: Record<number, string> = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };

export default async function CustomerJobPage({ params }: PageProps<"/customer/jobs/[jobId]">) {
  const { jobId } = await params;
  const job = getTicketByJobId(jobId) ?? getTicketByPublicToken(jobId);
  if (!job || job.clientId !== currentClientId) notFound();

  const client = getClient(job.clientId)!;
  const crew = ticketCrew(job);
  const progress = ticketProgress(job);
  const gaugeOffset = 125.6 - (125.6 * progress) / 100;
  const totals = job.billing ? billTotals(job.billing) : null;

  return (
    <>
      <Link
        href="/customer"
        className="inline-flex items-center gap-space-xs font-label-mono text-label-mono uppercase text-on-surface-variant hover:text-safety-orange font-bold"
      >
        <Icon name="arrow_back" className="text-[16px]" /> All Jobs
      </Link>

      <JobHero job={job} />

      {/* Interactive Milestone Stepper & Progress Engine */}
      <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg space-y-space-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div>
            <div className="flex items-center gap-space-xs text-safety-orange font-label-mono-sm text-label-mono-sm uppercase font-bold">
              <Icon name="timeline" className="text-[16px]" />
              <span>Execution Protocol</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Sub-Task Progression</h2>
          </div>
          <div className="flex items-center gap-space-md bg-surface-container-low px-space-md py-space-sm rounded-lg shadow-sm">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
                <circle className="text-surface-container" cx="24" cy="24" fill="none" r="20" stroke="currentColor" strokeWidth="4"></circle>
                <circle
                  className="text-safety-orange transition-all duration-1000"
                  cx="24"
                  cy="24"
                  fill="none"
                  r="20"
                  stroke="currentColor"
                  strokeDasharray="125.6"
                  strokeDashoffset={gaugeOffset}
                  strokeLinecap="round"
                  strokeWidth="4"
                ></circle>
              </svg>
              <span className="absolute font-headline-sm text-headline-sm font-bold text-slate-dark text-[13px]">{progress}%</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-slate-dark">Total Job Completion</span>
              <span className="font-label-mono-sm text-label-mono-sm text-industrial-green-deep font-semibold">
                {job.subtasks.filter((s) => s.status === "done").length} OF {job.subtasks.length} SUB-TASKS COMPLETE
              </span>
            </div>
          </div>
        </div>
        <div className={`grid grid-cols-1 md:grid-cols-2 ${lgCols[Math.min(job.subtasks.length, 4)]} gap-space-md`}>
          {job.subtasks.map((s, i) => {
            const tag = `${phaseLabel(i).toUpperCase()}`;
            if (s.status === "done") {
              return (
                <div key={s.id} className="relative flex flex-col justify-between p-space-md rounded-lg bg-surface-container-low shadow-sm space-y-space-md">
                  <div className="space-y-space-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant font-bold">{tag}</span>
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-industrial-green text-on-primary shadow-sm">
                        <Icon name="done" className="text-[18px]" />
                      </span>
                    </div>
                    <div className="font-headline-sm text-headline-sm text-on-surface">{s.title}</div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{s.description}</p>
                  </div>
                  <div className="pt-space-xs space-y-1">
                    <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                      <div className="bg-industrial-green h-full w-full"></div>
                    </div>
                    <div className="flex items-center justify-between text-label-mono-sm font-label-mono-sm text-on-surface-variant">
                      <span>COMPLETED</span>
                      <span className="font-bold text-on-surface">{s.completedAt ? formatDateTime(s.completedAt).toUpperCase() : "—"}</span>
                    </div>
                  </div>
                </div>
              );
            }
            if (s.status === "in_progress") {
              return (
                <div key={s.id} className="relative flex flex-col justify-between p-space-md rounded-lg bg-surface shadow-lg space-y-space-md">
                  <div className="absolute -top-3 left-4 px-space-sm py-0.5 rounded bg-safety-orange text-on-primary text-label-mono-sm font-label-mono-sm font-bold tracking-widest shadow-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-surface-container-lowest animate-ping"></span>
                    ACTIVE STAGE
                  </div>
                  <div className="space-y-space-sm pt-space-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-label-mono-sm text-label-mono-sm uppercase text-safety-orange font-bold">{tag}</span>
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-dark text-safety-orange-bright shadow-sm font-headline-sm text-headline-sm">
                        {i + 1}
                      </span>
                    </div>
                    <div className="font-headline-sm text-headline-sm text-on-surface">{s.title}</div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">{s.description}</p>
                  </div>
                  <div className="pt-space-xs space-y-2">
                    <div className="flex items-center justify-between text-label-mono font-label-mono">
                      <span className="text-safety-orange font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-safety-orange animate-pulse"></span>
                        IN PROGRESS
                      </span>
                      <span className="font-bold text-on-surface">{s.progress}% COMPLETE</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden shadow-inner">
                      <div className="bg-linear-to-r from-safety-orange to-safety-orange-bright h-full transition-all duration-700" style={{ width: `${s.progress}%` }}></div>
                    </div>
                    <div className="text-label-mono-sm font-label-mono-sm text-on-surface-variant flex items-center justify-between">
                      <span>EST: {s.estimate.toUpperCase()}</span>
                      <span>{s.dueDate ? `TARGET: ${formatDate(s.dueDate).toUpperCase()}` : "TARGET: TBC"}</span>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div key={s.id} className="relative flex flex-col justify-between p-space-md rounded-lg bg-surface-container-low opacity-90 shadow-sm space-y-space-md">
                <div className="space-y-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant font-bold">{tag}</span>
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-surface-container text-on-surface-variant">
                      <Icon name="lock_clock" className="text-[18px]" />
                    </span>
                  </div>
                  <div className="font-headline-sm text-headline-sm text-on-surface">{s.title}</div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{s.description}</p>
                </div>
                <div className="pt-space-xs space-y-1">
                  <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                    <div className="bg-surface-tint/20 h-full w-0"></div>
                  </div>
                  <div className="flex items-center justify-between text-label-mono-sm font-label-mono-sm text-on-surface-variant">
                    <span>STATUS: QUEUED</span>
                    <span className="font-bold">{s.dueDate ? `SCHEDULED ${formatDate(s.dueDate).slice(0, 6).toUpperCase()}` : `EST ${s.estimate.toUpperCase()}`}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-space-lg w-full">
        {/* Dedicated Service Team */}
        <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg space-y-space-md w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
            <div>
              <div className="flex items-center gap-space-xs text-safety-orange font-label-mono-sm text-label-mono-sm uppercase font-bold">
                <Icon name="badge" className="text-[16px]" />
                <span>Authorized Personnel</span>
              </div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface">Your Dedicated Service Team</h3>
            </div>
            <div className="hidden sm:flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container font-label-mono-sm text-label-mono-sm text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-industrial-green-bright"></span>
              <span>{crew.length} ENGINEERS ASSIGNED TO THIS JOB</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {crew.map((e) => {
              const lead = e.id === job.ownerId;
              return (
                <div key={e.id} className="p-space-md rounded-lg bg-surface-container-low shadow-sm flex flex-col justify-between space-y-space-sm">
                  <div className="flex items-center gap-space-md">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-dark shrink-0 shadow-sm">
                      <Avatar employee={e} size={56} className="w-full h-full" fallbackClassName="bg-slate-dark text-on-primary" />
                      {e.status !== "off_duty" && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-industrial-green-bright rounded-full ring-2 ring-surface-container-lowest"></span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-space-xs">
                        <span className="font-headline-sm text-headline-sm text-on-surface truncate">{e.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-on-primary font-label-mono-sm text-label-mono-sm shrink-0 ${lead ? "bg-safety-orange" : "bg-slate-dark"}`}
                        >
                          {lead ? "LEAD" : e.id}
                        </span>
                      </div>
                      <div className="font-body-sm text-body-sm text-on-surface-variant font-medium">{e.title}</div>
                      <div className="text-label-mono-sm font-label-mono-sm text-industrial-green-deep font-semibold flex items-center gap-1 mt-0.5 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-industrial-green-bright"></span>
                        <span>{employeeStatusLabel[e.status]}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-space-xs pt-space-xs">
                    <a
                      className="px-space-sm py-2 rounded bg-surface hover:bg-surface-container-high text-on-surface font-label-mono text-label-mono flex items-center justify-center gap-space-xs shadow-sm transition-colors text-center"
                      href={`tel:${e.phone.replace(/[^\d+]/g, "")}`}
                    >
                      <Icon name="call" className="text-[16px] text-safety-orange" />
                      <span>{e.phone}</span>
                    </a>
                    <a
                      className="px-space-sm py-2 rounded bg-slate-dark hover:bg-primary-container text-on-primary font-label-mono text-label-mono flex items-center justify-center gap-space-xs shadow-sm transition-colors"
                      href={`mailto:${e.email}?subject=${encodeURIComponent(job.jobId)}`}
                    >
                      <Icon name={lead ? "chat" : "mail"} className="text-[16px] text-safety-orange-bright" />
                      <span>{lead ? "Message Lead" : "Email"}</span>
                    </a>
                  </div>
                </div>
              );
            })}
            {/* Rapid Escalation Hotline Callout */}
            <div className="p-space-md rounded-lg bg-linear-to-br from-safety-orange to-secondary text-on-primary shadow-md flex flex-col justify-between space-y-space-xs">
              <div className="space-y-space-xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-mono-sm text-label-mono-sm uppercase font-bold text-on-secondary tracking-wider">24/7 Customer Care</span>
                  <Icon name="e911_emergency" className="text-on-primary text-[20px]" />
                </div>
                <div className="font-headline-md text-headline-md tracking-tight">Emergency Dispatch Help Desk</div>
                <p className="font-body-sm text-body-sm text-on-secondary/90">
                  Your care agent is {careAgent.name}. Immediate connection to the duty field supervisor &amp; logistics command.
                </p>
              </div>
              <div className="pt-space-xs">
                <a
                  className="w-full inline-flex items-center justify-center gap-space-xs px-space-md py-2 rounded bg-slate-dark text-on-primary font-label-mono text-label-mono font-bold hover:bg-slate-dark/90 shadow-sm transition-transform active:scale-95 text-center"
                  href="tel:18005552739"
                >
                  <Icon name="phone_in_talk" className="text-safety-orange-bright text-[18px]" />
                  <span>+1 (800) 555-APEX</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <DocumentsHub
          jobId={job.jobId}
          contactEmail={client.contactEmail}
          bill={
            job.billing && totals
              ? { invoiceId: job.billing.invoiceId, total: formatMoney(totals.total), due: formatDate(job.billing.dueDate) }
              : null
          }
        />
      </div>

      {/* SLA Precision Guarantee Banner */}
      <div className="relative w-full rounded-xl bg-slate-dark text-on-primary p-space-lg shadow-xl overflow-hidden">
        <div className="absolute -left-10 top-0 w-48 h-48 bg-safety-orange opacity-20 blur-3xl pointer-events-none"></div>
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-space-lg">
          <div className="flex items-center gap-space-md">
            <div className="w-14 h-14 rounded-lg bg-surface-container-lowest text-slate-dark flex items-center justify-center shrink-0 shadow-md">
              <Icon name="verified" className="text-[32px] text-safety-orange" fill />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-space-sm flex-wrap">
                <span className="font-headline-md text-headline-md text-on-primary">Apex Precision SLA Guarantee</span>
                <span className="px-space-sm py-0.5 rounded bg-industrial-green font-label-mono-sm text-label-mono-sm uppercase font-bold text-on-primary">
                  {client.tier}
                </span>
              </div>
              <p className="font-body-md text-body-md text-primary-fixed-dim max-w-2xl">
                All field work is backed by agreed commissioning milestones. If hand-off exceeds the agreed end date, warranty credits apply per your
                Master Agreement {client.contractRef}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-md shrink-0">
            <div className="text-right hidden sm:block">
              <div className="font-label-mono-sm text-label-mono-sm text-primary-fixed-dim uppercase">Agreed End Date</div>
              <div className="font-label-mono text-label-mono font-bold text-safety-orange-bright">{formatDate(job.endDate).toUpperCase()}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
