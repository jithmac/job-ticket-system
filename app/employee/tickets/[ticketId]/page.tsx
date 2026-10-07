import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getClient, getEmployee, getTicket, getTickets } from "@/lib/db-data";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { customerJobUrl, ticketCrew } from "@/lib/tickets";
import { TicketWorkspace } from "../../_components/ticket-workspace";
import { PageHeader, PriorityBadge, StatusBadge } from "../../_components/ui";

/** Pre-render every known ticket at build time (static, instantly prefetchable). */
export async function generateStaticParams() {
  const tickets = await getTickets();
  return tickets.map((t) => ({ ticketId: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/employee/tickets/[ticketId]">): Promise<Metadata> {
  const { ticketId } = await params;
  return { title: (await getTicket(ticketId))?.title ?? ticketId };
}

export default async function EmployeeTicketPage({ params }: PageProps<"/employee/tickets/[ticketId]">) {
  const session = await requireRole([UserRole.EMPLOYEE]);
  const { ticketId } = await params;
  const ticket = await getTicket(ticketId);
  if (!ticket) notFound();
  if (ticket.ownerId !== session.id && ticket.createdById !== session.id && !ticket.participantIds.includes(session.id)) {
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
        client={(await getClient(ticket.clientId))!}
        me={(await getEmployee(session.id))!}
        customerLink={customerJobUrl(ticket)}
      />
    </>
  );
}
