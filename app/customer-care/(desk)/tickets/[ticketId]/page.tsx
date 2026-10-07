import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTicket, getTickets } from "@/lib/db-data";
import { TicketDossier } from "../../../_components/ticket-dossier";

export async function generateStaticParams() {
  const tickets = await getTickets();
  return tickets.map((t) => ({ ticketId: t.id }));
}

export async function generateMetadata({ params }: PageProps<"/customer-care/tickets/[ticketId]">): Promise<Metadata> {
  const { ticketId } = await params;
  return { title: `Dossier ${ticketId}` };
}

/** Only this page re-renders when another ticket is picked; the (desk) layout persists. */
export default async function CareTicketPage({ params }: PageProps<"/customer-care/tickets/[ticketId]">) {
  const { ticketId } = await params;
  const ticket = await getTicket(ticketId);
  if (!ticket) notFound();
  return <TicketDossier ticket={ticket} />;
}
