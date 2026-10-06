import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentEmployeeId, tickets } from "@/lib/data";
import { getClient, getEmployee, getTicket, ticketCrew } from "@/lib/tickets";
import { TicketWorkspace } from "../../_components/ticket-workspace";
import { PageHeader, PriorityBadge, StatusBadge } from "../../_components/ui";

/** Pre-render every known ticket at build time (static, instantly prefetchable). */
export function generateStaticParams() {
  return tickets.map((t) => ({ ticketId: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/employee/tickets/[ticketId]">): Promise<Metadata> {
  const { ticketId } = await params;
  return { title: getTicket(ticketId)?.title ?? ticketId };
}

export default async function EmployeeTicketPage({ params }: PageProps<"/employee/tickets/[ticketId]">) {
  const { ticketId } = await params;
  const ticket = getTicket(ticketId);
  if (!ticket) notFound();

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
        crew={ticketCrew(ticket)}
        client={getClient(ticket.clientId)!}
        me={getEmployee(currentEmployeeId)!}
      />
    </>
  );
}
