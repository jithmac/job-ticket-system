import type { Metadata } from "next";
import { categories, clients, currentEmployeeId, employees } from "@/lib/data";
import { getEmployee } from "@/lib/tickets";
import { emptyDraft, nextTicketId } from "../../_components/draft";
import { RecentTicketsCard } from "../../_components/recent-tickets-card";
import { TicketWizard } from "../../_components/ticket-wizard";
import { PageHeader, SlaPolicyBanner } from "../../_components/ui";

export const metadata: Metadata = { title: "New Ticket" };

export default function NewTicketPage() {
  const me = getEmployee(currentEmployeeId)!;
  const ticketId = nextTicketId();

  return (
    <>
      <PageHeader
        title="Create New Ticket"
        subtitle="Fill out the details below to log a new job ticket."
        meta={
          <>
            FORM-REF: <span className="text-slate-dark font-semibold">{ticketId}</span>
          </>
        }
      />
      <TicketWizard
        mode="create"
        ticketId={ticketId}
        owner={me}
        employees={employees}
        clients={clients}
        categories={categories}
        initial={emptyDraft}
        sidebar={
          <>
            {/* Server-rendered content passed through the client wizard as a prop */}
            <RecentTicketsCard />
            <SlaPolicyBanner />
          </>
        }
      />
    </>
  );
}
