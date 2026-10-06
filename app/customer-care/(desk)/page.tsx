import type { Metadata } from "next";
import { tickets } from "@/lib/data";
import { urgency } from "@/lib/tickets";
import { TicketDossier } from "../_components/ticket-dossier";

export const metadata: Metadata = { title: "Ticket Desk" };

/** Desk landing: opens the most urgent ticket (the stream highlights it). */
export default function CareDeskPage() {
  const top = [...tickets].sort((a, b) => urgency(b) - urgency(a))[0];
  return <TicketDossier ticket={top} />;
}
