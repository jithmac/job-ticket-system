import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { adminUser, departments, employees, skillLevels, tickets } from "@/lib/data";
import {
  activeSubtaskIndex,
  daysRemaining,
  formatDateTime,
  getClient,
  getEmployee,
  getTicket,
  phaseLabel,
  remainingLabel,
  ticketCrew,
  ticketProgress,
  ticketsForClient,
} from "@/lib/tickets";
import { ActivityLog } from "../../_components/activity-log";
import { AddEmployeeForm } from "../../_components/add-employee-form";
import { CrewManager } from "../../_components/crew-manager";
import { TicketControls } from "../../_components/ticket-controls";
import { PageTitle, PhaseGrid } from "../../_components/ui";

export function generateStaticParams() {
  return tickets.map((t) => ({ ticketId: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/admin/tickets/[ticketId]">): Promise<Metadata> {
  const { ticketId } = await params;
  return { title: `Ticket ${ticketId}` };
}

const attachmentIcon = { image: "image", pdf: "picture_as_pdf", log: "terminal", doc: "description", sheet: "table_chart" };

export default async function AdminTicketPage({ params }: PageProps<"/admin/tickets/[ticketId]">) {
  const { ticketId } = await params;
  const ticket = getTicket(ticketId);
  if (!ticket) notFound();

  const client = getClient(ticket.clientId)!;
  const crew = ticketCrew(ticket);
  const progress = ticketProgress(ticket);
  const active = activeSubtaskIndex(ticket);
  const clientTickets = ticketsForClient(client.id);
  const live = ticket.status !== "completed";

  return (
    <>
      <PageTitle
        back={{ href: "/admin/tickets", label: "Back to ticket console" }}
        backMeta={`JOB ID: ${ticket.jobId} // ${ticket.priority.toUpperCase()} PRIORITY`}
        id={ticket.id}
        badges={
          <>
            <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded text-xs font-label-mono font-semibold border border-amber-300 flex items-center gap-1">
              <Icon name="bolt" className="text-xs" />
              {ticket.category.toUpperCase()}
            </span>
            {live ? (
              <span className="bg-emerald-50 text-industrial-green px-2.5 py-0.5 rounded text-xs font-label-mono font-semibold border border-emerald-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-industrial-green animate-ping"></span>
                LIVE IN FIELD
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded text-xs font-label-mono font-semibold border border-slate-300">
                CLOSED
              </span>
            )}
          </>
        }
        title={ticket.title}
      />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (Main Context) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <section className="bg-white border border-slate-200 rounded p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <Icon name="timeline" className="text-safety-orange text-lg" />
                <h2 className="text-base font-headline-md font-bold text-slate-900">Job Process &amp; Operational Lifecycle</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-label-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {active === -1 ? "All Phases Complete" : `${phaseLabel(active)} of ${ticket.subtasks.length} In Progress`}
                </span>
                <span className="text-xs font-label-mono font-bold text-safety-orange bg-orange-50 px-2 py-0.5 rounded border border-safety-orange/30">
                  {progress}% Overall
                </span>
              </div>
            </div>
            <PhaseGrid subtasks={ticket.subtasks} />
          </section>

          <section className="bg-white border border-slate-200 rounded p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-headline-md font-bold text-slate-900 flex items-center gap-2">
                <Icon name="segment" className="text-safety-orange text-lg" />
                Description &amp; Diagnostic Overview
              </h2>
              <span className="text-xs font-label-mono text-slate-400">UPDATED: {formatDateTime(ticket.updatedAt)}</span>
            </div>
            <div className="text-sm font-body-md text-slate-700 leading-relaxed space-y-3">
              <p>{ticket.description}</p>
              <div className="bg-slate-50 border-l-2 border-slate-400 p-3 rounded-r text-xs font-label-mono text-slate-800">
                <p className="font-bold text-slate-900 mb-1">SUBTASK SCOPE:</p>
                <ol className="list-decimal pl-4 space-y-0.5 text-slate-600">
                  {ticket.subtasks.map((s) => (
                    <li key={s.id}>
                      {s.title} — <span className="text-slate-500">{s.assigneeIds.map((id) => getEmployee(id)?.name).join(", ")}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <Icon name="corporate_fare" className="text-slate-700 text-lg" />
                <h2 className="text-base font-headline-md font-bold text-slate-900">Client &amp; Facility Dossier</h2>
              </div>
              <span className="text-xs font-label-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-industrial-green"></span> {client.tier.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded border border-slate-200">
              <div className="space-y-1">
                <div className="text-[11px] font-label-mono uppercase text-slate-500 font-semibold">Client / Account</div>
                <div className="text-sm font-bold text-slate-900">{client.name}</div>
                <div className="text-xs text-slate-600 font-label-mono">Facility: {client.facility}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-label-mono uppercase text-slate-500 font-semibold">Account Liaison / Requester</div>
                <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-dark text-white text-[10px] flex items-center justify-center font-label-mono">
                    {client.contactName
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </span>{" "}
                  {client.contactName}
                </div>
                <div className="text-xs text-slate-600 font-label-mono break-all">
                  {client.contactEmail} • {client.contactPhone}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-label-mono uppercase text-slate-500 font-semibold">Account Standing &amp; History</div>
                <div className="text-xs font-bold text-industrial-green-deep flex items-center gap-1">
                  <Icon name="verified" className="text-sm" /> {client.contractRef}
                </div>
                <div className="text-[11px] text-slate-500 font-label-mono mt-0.5">
                  {clientTickets.filter((t) => t.status === "completed").length} Closed Tickets •{" "}
                  {clientTickets.filter((t) => t.status !== "completed").length} Active
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-base font-headline-md font-bold text-slate-900 flex items-center gap-2">
                <Icon name="attach_file" className="text-slate-700 text-lg" />
                Diagnostics &amp; Attachments
              </h2>
              <span className="text-xs font-label-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {ticket.attachments.length} Files
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {ticket.attachments.length === 0 && <p className="text-xs font-label-mono text-slate-400">No attachments.</p>}
              {ticket.attachments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded hover:border-safety-orange hover:bg-orange-50/20 transition-all cursor-pointer group flex-1 min-w-[220px]"
                >
                  <div className="bg-white border border-slate-200 w-10 h-10 rounded flex items-center justify-center text-slate-600 group-hover:text-safety-orange group-hover:border-safety-orange/40 transition-colors">
                    <Icon name={attachmentIcon[a.kind]} className="text-xl" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-label-mono font-bold text-slate-900 group-hover:text-safety-orange transition-colors">{a.name}</span>
                    <span className="text-[11px] font-label-mono-sm text-slate-500">
                      {a.size} • {a.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <ActivityLog entries={ticket.activity} people={employees} author={adminUser} />
        </div>

        {/* Right Column (Sidebar Metadata & Industrial Actions) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <TicketControls
            status={ticket.status}
            priority={ticket.priority}
            requests={ticket.priorityRequests}
            category={ticket.category}
            endDate={ticket.endDate}
            holder={getEmployee(ticket.ownerId)?.name ?? "—"}
          >
            {/* Server-rendered children slotted inside a client component */}
            <CrewManager crew={crew} ownerId={ticket.ownerId} roster={employees} />
            <AddEmployeeForm
              activeCount={employees.filter((e) => e.status !== "off_duty").length}
              departments={departments}
              skillLevels={skillLevels}
            />
          </TicketControls>
          {/* Job Telemetry Widget */}
          <section className="bg-slate-900 text-slate-300 rounded p-4 font-label-mono text-xs border border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
              <span className="text-slate-400 font-bold">JOB TELEMETRY</span>
              <span className="text-safety-orange-bright text-[10px]">{progress}% COMPLETE</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtasks Done:</span>
                <span className="text-slate-200">
                  {ticket.subtasks.filter((s) => s.status === "done").length} / {ticket.subtasks.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Schedule:</span>
                <span className={daysRemaining(ticket) < 0 && live ? "text-red-300" : "text-amber-400"}>{remainingLabel(ticket)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Asset Tag:</span>
                <span className="text-slate-200">{ticket.assetTag}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Crew On Job:</span>
                <span className="text-emerald-400">{crew.length} ASSIGNED</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
