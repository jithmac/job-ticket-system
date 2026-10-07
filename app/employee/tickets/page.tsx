import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { getClients, getEmployees } from "@/lib/db-data";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import {
  formatDate,
  isOverdue,
  remainingLabel,
  ticketProgress,
  ticketsForEmployee,
  urgency,
} from "@/lib/tickets";
import { TicketsTable, type TicketRow } from "../_components/tickets-table";
import { PageHeader } from "../_components/ui";

export const metadata: Metadata = { title: "My Tickets" };

export default async function MyTicketsPage() {
  const session = await requireRole([UserRole.EMPLOYEE]);
  // Rows are computed on the server; only plain data crosses into the client table.
  const tickets = await ticketsForEmployee(session.id);
  const [clients, employees] = await Promise.all([getClients(), getEmployees()]);
  const clientsById = new Map(clients.map((client) => [client.id, client]));
  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));
  const rows: TicketRow[] = tickets
    .sort((a, b) => urgency(b) - urgency(a))
    .map((t) => ({
      id: t.id,
      jobId: t.jobId,
      title: t.title,
      client: clientsById.get(t.clientId)?.name ?? "—",
      holder: employeesById.get(t.ownerId)?.name ?? "—",
      isHolder: t.ownerId === session.id,
      role: t.ownerId === session.id ? "Holder" : t.createdById === session.id ? "Creator" : "Participant",
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
