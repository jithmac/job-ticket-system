import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { careAgent } from "@/lib/data";
import {
  activeSubtaskIndex,
  formatDate,
  formatDateTime,
  getClient,
  isOverdue,
  phaseLabel,
  remainingLabel,
  subtaskProgress,
  ticketCrew,
  ticketProgress,
} from "@/lib/tickets";
import { employeeStatusLabel } from "@/lib/format";
import type { Ticket } from "@/lib/types";
import { CareNotes } from "./care-notes";
import { DossierActions } from "./dossier-actions";
import { PriorityRequestForm } from "./priority-request";
import { SectionCard, SectionHeading } from "./ui";

const colsClass: Record<number, string> = { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" };

/** Right-hand "Active Dossier" from the customer-care sample. */
export function TicketDossier({ ticket }: { ticket: Ticket }) {
  const client = getClient(ticket.clientId)!;
  const crew = ticketCrew(ticket);
  const progress = ticketProgress(ticket);
  const active = activeSubtaskIndex(ticket);
  const overdue = isOverdue(ticket);
  const latest = [...ticket.activity].filter((a) => a.kind === "employee").sort((a, b) => b.at.localeCompare(a.at))[0];
  const schedule =
    ticket.status === "completed"
      ? { label: "DELIVERED", cls: "bg-slate-dark" }
      : overdue
        ? { label: "OVERDUE", cls: "bg-error" }
        : { label: "ON SCHEDULE", cls: "bg-industrial-green-deep" };

  return (
    <>
      {/* Top Command Strip for Dossier */}
      <div className="bg-slate-dark text-on-primary p-space-md rounded shadow-md flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm">
          <span className="px-space-sm py-1 bg-safety-orange text-on-primary rounded font-label-mono text-label-mono font-bold tracking-wider">
            ACTIVE DOSSIER
          </span>
          <span className="font-label-mono text-label-mono text-primary-fixed-dim">{ticket.jobId} • {ticket.assetTag}</span>
        </div>
        <DossierActions />
      </div>

      {/* Section A: Job Header & Real-Time Progress Report */}
      <SectionCard>
        <div className="flex flex-wrap items-start justify-between gap-space-md">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-space-xs flex-wrap">
              <span className="font-label-mono text-label-mono font-bold text-safety-orange">#{ticket.id}</span>
              <span className="px-space-xs py-0.5 rounded bg-surface-container text-slate-dark font-label-mono-sm text-label-mono-sm uppercase">
                {ticket.category}
              </span>
              <span className={`px-space-xs py-0.5 rounded text-on-tertiary font-label-mono-sm text-label-mono-sm ${schedule.cls}`}>{schedule.label}</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-slate-dark mt-space-xs">{ticket.title}</h2>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">Target Completion</span>
            <span className="font-headline-sm text-headline-sm text-slate-dark font-bold">{formatDate(ticket.endDate)}</span>
            <span className={`font-label-mono-sm text-label-mono-sm font-bold ${overdue ? "text-error" : "text-safety-orange"}`}>
              {remainingLabel(ticket)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-space-sm pt-space-xs">
          <div className="flex items-center justify-between">
            <span className="font-headline-sm text-headline-sm uppercase text-slate-dark tracking-wide">Phase Progression ({progress}% Overall)</span>
            <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">
              {active === -1 ? "All Gates Complete" : `Gate ${active + 1} of ${ticket.subtasks.length} Active`}
            </span>
          </div>
          <div className={`grid grid-cols-2 ${colsClass[Math.min(ticket.subtasks.length, 4)]} gap-space-xs text-left`}>
            {ticket.subtasks.map((s, i) => {
              const pct = subtaskProgress(s);
              if (s.status === "done")
                return (
                  <div key={s.id} className="p-space-sm rounded bg-surface-container-low flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">{phaseLabel(i).toUpperCase()}</span>
                      <Icon name="check_circle" className="text-industrial-green text-[18px]" />
                    </div>
                    <span className="font-body-sm text-body-sm font-bold text-slate-dark mt-1">{s.title}</span>
                    <span className="font-label-mono-sm text-label-mono-sm text-industrial-green font-bold mt-1">100% DONE</span>
                  </div>
                );
              if (s.status === "in_progress")
                return (
                  <div key={s.id} className="p-space-sm rounded bg-surface-container shadow-sm flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-2 bg-safety-orange rounded-full m-1"></div>
                    <div className="flex items-center justify-between">
                      <span className="font-label-mono-sm text-label-mono-sm text-safety-orange font-bold">{phaseLabel(i).toUpperCase()} [ACTIVE]</span>
                      <Icon name="autorenew" className="text-safety-orange text-[18px] animate-spin" />
                    </div>
                    <span className="font-body-sm text-body-sm font-bold text-slate-dark mt-1">{s.title}</span>
                    <span className="font-label-mono-sm text-label-mono-sm text-safety-orange font-bold mt-1">{pct}% IN PROGRESS</span>
                  </div>
                );
              return (
                <div key={s.id} className="p-space-sm rounded bg-surface-container-low opacity-60 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">{phaseLabel(i).toUpperCase()}</span>
                    <Icon name="pending" className="text-on-surface-variant text-[18px]" />
                  </div>
                  <span className="font-body-sm text-body-sm font-bold text-slate-dark mt-1">{s.title}</span>
                  <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant mt-1">QUEUED</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-space-md rounded bg-surface-container-low flex flex-col md:flex-row gap-space-md justify-between items-center">
          <div className="flex flex-col gap-1 w-full md:w-2/3">
            <div className="flex items-center gap-space-xs">
              <span className="w-2 h-2 rounded-full bg-industrial-green-bright animate-ping"></span>
              <span className="font-label-mono text-label-mono text-slate-dark font-bold uppercase">
                Latest Field Dispatch Entry{latest ? ` (${formatDateTime(latest.at)})` : ""}:
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant italic">
              {latest ? `“${latest.text}”` : "No field updates posted yet."}
            </p>
            {latest && (
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                Recorded by {latest.authorName} ({latest.authorId}) via Employee Panel
              </span>
            )}
          </div>
          <div className="flex flex-col items-center justify-center p-space-sm bg-surface-container-lowest rounded shadow-sm w-full md:w-auto shrink-0">
            <span className="font-label-mono-sm text-label-mono-sm uppercase text-slate-dark font-bold">Completion Gauge</span>
            <svg className="mt-1" height="40" viewBox="0 0 140 40" width="140" aria-hidden="true">
              <rect x="0" y="16" width="140" height="8" rx="2" className="fill-surface-container-high" />
              <rect x="0" y="16" width={(140 * progress) / 100} height="8" rx="2" className={overdue ? "fill-error" : "fill-safety-orange"} />
              {[35, 70, 105].map((x) => (
                <line key={x} x1={x} x2={x} y1="10" y2="30" className="stroke-slate-border" strokeWidth="1" />
              ))}
            </svg>
            <div className="flex items-center justify-between w-full font-label-mono-sm text-label-mono-sm text-slate-dark mt-1 gap-space-md">
              <span>{progress}% DONE</span>
              <span className={`font-bold ${overdue ? "text-error" : "text-industrial-green"}`}>{overdue ? "LATE" : "NOMINAL"}</span>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Section B: Client Entity Profile & Rapid Contact Operations */}
      <SectionCard>
        <SectionHeading
          icon="corporate_fare"
          title="Client Entity & Facility Liaison"
          right={
            <span className="px-space-sm py-0.5 rounded bg-surface-container font-label-mono-sm text-label-mono-sm font-bold text-slate-dark uppercase">
              {client.tier} SLA
            </span>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md items-start">
          <div className="flex flex-col gap-space-xs">
            <div className="flex flex-col">
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">Organization</span>
              <span className="font-headline-sm text-headline-sm text-slate-dark font-bold">{client.name}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Master Contract: {client.contractRef}</span>
            </div>
            <div className="flex flex-col pt-space-xs">
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">Primary Stakeholder</span>
              <span className="font-body-lg text-body-lg text-slate-dark font-bold">{client.contactName}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{client.contactRole}</span>
            </div>
            <div className="flex flex-col pt-space-xs font-label-mono text-label-mono text-slate-dark">
              <div className="flex items-center gap-2">
                <Icon name="call" className="text-[16px] text-on-surface-variant" />
                <span>{client.contactPhone} (Direct Office)</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Icon name="mail" className="text-[16px] text-on-surface-variant" />
                <span className="text-safety-orange break-all">{client.contactEmail}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-space-sm bg-surface-container-low p-space-md rounded">
            <div className="flex items-start gap-space-xs">
              <Icon name="location_on" className="text-slate-dark text-[18px] shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant">Field Job Physical Address</span>
                <span className="font-body-md text-body-md font-bold text-slate-dark">{client.facility}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">{client.address}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-space-xs font-label-mono-sm text-label-mono-sm gap-2">
              <span className="text-on-surface-variant">Badging &amp; Access:</span>
              <span className="font-bold text-slate-dark text-right">{client.accessLevel}</span>
            </div>
            <div className="flex items-center justify-between font-label-mono-sm text-label-mono-sm gap-2">
              <span className="text-on-surface-variant">Site Safety Protocol:</span>
              <span className="text-industrial-green font-bold text-right">{client.safetyProtocol}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-xs pt-space-xs">
          <a
            href={`tel:${client.contactPhone.replace(/[^\d+]/g, "")}`}
            className="flex items-center justify-center gap-space-xs px-space-md py-2.5 bg-slate-dark hover:bg-slate-dark/90 text-on-primary rounded font-label-mono text-label-mono font-bold transition-all shadow-sm"
          >
            <Icon name="phone_in_talk" className="text-[18px]" />
            <span>Call Direct</span>
          </a>
          <a
            href={`sms:${client.contactPhone.replace(/[^\d+]/g, "")}`}
            className="flex items-center justify-center gap-space-xs px-space-md py-2.5 bg-surface-container hover:bg-surface-container-high text-slate-dark rounded font-label-mono text-label-mono font-bold transition-all shadow-sm"
          >
            <Icon name="sms" className="text-[18px] text-industrial-green" />
            <span>Send SMS / WhatsApp</span>
          </a>
          <a
            href={`mailto:${client.contactEmail}?subject=${encodeURIComponent(`Progress report ${ticket.jobId}`)}`}
            className="flex items-center justify-center gap-space-xs px-space-md py-2.5 bg-surface-container hover:bg-surface-container-high text-slate-dark rounded font-label-mono text-label-mono font-bold transition-all shadow-sm"
          >
            <Icon name="picture_as_pdf" className="text-[18px] text-safety-orange" />
            <span>Email Progress Report</span>
          </a>
        </div>
      </SectionCard>

      {/* Section C: Assigned Field Team */}
      <SectionCard>
        <SectionHeading
          icon="groups"
          title="Field Crew Deployment & Technician Roster"
          right={
            <Link
              href="/customer-care/employees"
              className="px-space-xs py-1 rounded bg-surface-container hover:bg-surface-container-high text-slate-dark font-label-mono-sm text-label-mono-sm font-bold flex items-center gap-1 transition-all"
            >
              <Icon name="badge" className="text-[14px]" /> Employee Directory
            </Link>
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
          {crew.map((e) => {
            const holder = e.id === ticket.ownerId;
            return (
              <div key={e.id} className="p-space-md rounded bg-surface-container-low flex flex-col justify-between">
                <div className="flex items-center gap-space-sm">
                  <Avatar
                    employee={{ ...e, avatarUrl: undefined }}
                    size={40}
                    className="rounded"
                    fallbackClassName={holder ? "bg-slate-dark text-on-primary" : "bg-surface-container text-slate-dark"}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className={`font-label-mono-sm text-label-mono-sm uppercase ${holder ? "text-safety-orange font-bold" : "text-on-surface-variant"}`}>
                      {holder ? "TICKET HOLDER" : e.title}
                    </span>
                    <span className="font-headline-sm text-headline-sm text-slate-dark truncate font-bold">{e.name}</span>
                    <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">{e.id}</span>
                  </div>
                </div>
                <div className="mt-space-sm flex items-center justify-between text-on-surface-variant font-label-mono-sm text-label-mono-sm gap-2">
                  <span className={`font-bold flex items-center gap-1 ${e.status === "off_duty" ? "text-on-surface-variant" : "text-industrial-green"}`}>
                    {e.status === "on_site" && <span className="w-1.5 h-1.5 rounded-full bg-industrial-green-bright animate-ping"></span>}
                    {employeeStatusLabel[e.status]}
                  </span>
                  <a className="text-slate-dark hover:text-safety-orange font-bold" href={`tel:${e.phone.replace(/[^\d+]/g, "")}`}>
                    Call
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Section: Notes for the field crew (visible on the employee panel) */}
      <CareNotes
        key={`notes-${ticket.id}`}
        ticketId={ticket.id}
        contactName={client.contactName}
        agent={careAgent}
        initial={[...ticket.activity].sort((a, b) => b.at.localeCompare(a.at))}
      />

      {/* Section: Priority change request */}
      <PriorityRequestForm key={`prio-${ticket.id}`} current={ticket.priority} initial={ticket.priorityRequests} agent={careAgent} />
    </>
  );
}
