import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { currentEmployeeId, getClients, getEmployees } from "@/lib/db-data";
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
  // Rows are computed on the server; only plain data crosses into the client table.
  const tickets = await ticketsForEmployee(currentEmployeeId);
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
