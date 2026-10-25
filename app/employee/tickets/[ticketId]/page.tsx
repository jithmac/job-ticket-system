import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getEmployeeTicket } from "@/lib/db-data";
import { employeeFromSession, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { customerJobUrl, ticketCrew } from "@/lib/tickets";
import { TicketWorkspace } from "../../_components/ticket-workspace";
import { PageHeader, PriorityBadge, StatusBadge } from "../../_components/ui";

export async function generateMetadata({ params }: PageProps<"/employee/tickets/[ticketId]">): Promise<Metadata> {
  const { ticketId } = await params;
  return { title: `Ticket ${ticketId}` };
}

export default async function EmployeeTicketPage({ params }: PageProps<"/employee/tickets/[ticketId]">) {
  const session = await requireRole([UserRole.EMPLOYEE]);
  const { ticketId } = await params;
  const ticket = await getEmployeeTicket(ticketId);
  if (!ticket) notFound();
  if (
    ticket.ownerId !== session.id &&
    ticket.createdById !== session.id &&
    (!ticket.participantIds.includes(session.id) || ticket.pendingParticipantIds?.includes(session.id))
  ) {
    redirect("/employee/tickets");
  }

  return (
    <>
      <PageHeader
        back={{ href: "/employee/tickets", label: "Back to my tickets" }}
        title={ticket.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span className="text-xs font-label-mono">{ticket.category}</span>
          </span>
        }
        meta={
          <>
            TICKET: <span className="text-slate-dark font-semibold">#{ticket.id}</span>
          </>
        }
      />
      <TicketWorkspace
        ticket={ticket}
        crew={await ticketCrew(ticket)}
        me={employeeFromSession(session)}
        customerLink={customerJobUrl(ticket)}
      />
    </>
  );
}
