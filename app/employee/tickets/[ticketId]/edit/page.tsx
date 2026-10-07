import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories, getClients, getEmployee, getEmployees, getTicket, getTickets } from "@/lib/db-data";
import { ticketToDraft } from "../../../_components/draft";
import { RecentTicketsCard } from "../../../_components/recent-tickets-card";
import { TicketWizard } from "../../../_components/ticket-wizard";
import { PageHeader, SlaPolicyBanner } from "../../../_components/ui";

export async function generateStaticParams() {
  const tickets = await getTickets();
  return tickets.map((t) => ({ ticketId: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/employee/tickets/[ticketId]/edit">): Promise<Metadata> {
  const { ticketId } = await params;
  return { title: `Update ${ticketId}` };
}

export default async function EditTicketPage({ params }: PageProps<"/employee/tickets/[ticketId]/edit">) {
  const { ticketId } = await params;
  const ticket = await getTicket(ticketId);
  if (!ticket) notFound();
  const [creator, employees, clients] = await Promise.all([getEmployee(ticket.createdById), getEmployees(), getClients()]);

  return (
    <>
      <PageHeader
        back={{ href: `/employee/tickets/${ticket.id}`, label: "Back to ticket" }}
        title="Update Ticket"
        subtitle={ticket.title}
        meta={
          <>
            TICKET: <span className="text-slate-dark font-semibold">#{ticket.id}</span>
          </>
        }
      />
      <TicketWizard
        mode="edit"
        ticketId={ticket.id}
        owner={creator!}
        employees={employees}
        clients={clients}
        categories={categories}
        initial={ticketToDraft(ticket)}
        sidebar={
          <>
            <RecentTicketsCard />
            <SlaPolicyBanner />
          </>
        }
      />
    </>
  );
}
