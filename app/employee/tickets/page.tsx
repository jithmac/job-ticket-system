import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { currentEmployeeId } from "@/lib/data";
import {
  formatDate,
  getClient,
  getEmployee,
  isOverdue,
  remainingLabel,
  ticketProgress,
  ticketsForEmployee,
  urgency,
} from "@/lib/tickets";
import { TicketsTable, type TicketRow } from "../_components/tickets-table";
import { PageHeader } from "../_components/ui";

export const metadata: Metadata = { title: "My Tickets" };

export default function MyTicketsPage() {
  // Rows are computed on the server; only plain data crosses into the client table.
  const rows: TicketRow[] = ticketsForEmployee(currentEmployeeId)
    .sort((a, b) => urgency(b) - urgency(a))
    .map((t) => ({
      id: t.id,
      jobId: t.jobId,
      title: t.title,
      client: getClient(t.clientId)?.name ?? "—",
      holder: getEmployee(t.ownerId)?.name ?? "—",
      isHolder: t.ownerId === currentEmployeeId,
      role: t.ownerId === currentEmployeeId ? "Holder" : t.createdById === currentEmployeeId ? "Creator" : "Participant",
      priority: t.priority,
      status: t.status,
      progress: ticketProgress(t),
      endDate: formatDate(t.endDate),
      remaining: remainingLabel(t),
      overdue: isOverdue(t),
    }));

  return (
    <>
      <PageHeader
        title="My Tickets"
        subtitle="Every ticket you hold, created, or participate in."
        meta={
          <Link
            href="/employee/tickets/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 btn-safety rounded font-label-mono text-xs uppercase tracking-wider font-semibold text-white shadow hover:shadow-md transition-all"
          >
            <Icon name="add_box" className="text-base" /> New Ticket
          </Link>
        }
      />
      <TicketsTable rows={rows} />
    </>
  );
}
