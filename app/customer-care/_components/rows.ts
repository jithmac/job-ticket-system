import {
  activeSubtaskIndex,
  daysRemaining,
  isOverdue,
  ticketCrew,
  ticketProgress,
  urgency,
} from "@/lib/tickets";
import { getClient, getEmployee } from "@/lib/db-data";
import type { Priority, Ticket } from "@/lib/types";

/** Plain, serialisable summary of a ticket for the customer care stream. */
export interface CareRow {
  id: string;
  jobId: string;
  assetTag: string;
  title: string;
  priority: Priority;
  client: string;
  slaLabel: string;
  slaTone: "ok" | "warn" | "bad" | "muted";
  phaseLabel: string;
  progress: number;
  barTone: "orange" | "green" | "dark" | "red";
  lead: string;
  endDate: string;
  urgency: number;
  footerLabel: string;
  footerTone: "ok" | "warn" | "bad" | "dark";
  flags: { active: boolean; critical: boolean; overdue: boolean; signoff: boolean; field: boolean; completed: boolean };
  /** Everything an ID search should hit: ticket, job, client, crew names and IDs. */
  search: string;
}

export async function careRow(t: Ticket): Promise<CareRow> {
  const progress = ticketProgress(t);
  const days = daysRemaining(t);
  const overdue = isOverdue(t);
  const idx = activeSubtaskIndex(t);
  const [owner, crew, client] = await Promise.all([getEmployee(t.ownerId), ticketCrew(t), getClient(t.clientId)]);
  const completed = t.status === "completed";

  return {
    id: t.id,
    jobId: t.jobId,
    assetTag: t.assetTag,
    title: t.title,
    priority: t.priority,
    client: client?.name ?? "—",
    slaLabel: completed ? "Delivered" : overdue ? "OVERDUE SLA" : days <= 3 ? `${Math.max(days, 0) * 24}h SLA Remaining` : `SLA: ${days * 24}h`,
    slaTone: completed ? "muted" : overdue ? "bad" : days <= 3 ? "warn" : "ok",
    phaseLabel:
      idx === -1
        ? `All ${t.subtasks.length} phases complete`
        : `Phase ${idx + 1} of ${t.subtasks.length}: ${t.subtasks[idx].title}`,
    progress,
    barTone: overdue ? "red" : completed || t.status === "awaiting_signoff" ? "green" : t.priority === "medium" || t.priority === "low" ? "dark" : "orange",
    lead: owner ? `${owner.name} (${owner.id})` : "—",
    endDate: t.endDate,
    urgency: urgency(t),
    footerLabel: completed
      ? "Closed"
      : overdue
        ? "Triage Queue"
        : t.status === "awaiting_signoff"
          ? "Pending Sign-off"
          : t.status === "open"
            ? "Awaiting Dispatch"
            : "Field Active",
    footerTone: completed ? "dark" : overdue ? "bad" : t.status === "awaiting_signoff" ? "warn" : "ok",
    flags: {
      active: !completed,
      critical: t.priority === "critical" && !completed,
      overdue,
      signoff: t.status === "awaiting_signoff",
      field: t.status === "in_progress",
      completed,
    },
    search: [t.id, t.jobId, t.title, t.assetTag, client?.name, ...crew.flatMap((e) => [e.name, e.id])]
      .join(" ")
      .toLowerCase(),
  };
}
