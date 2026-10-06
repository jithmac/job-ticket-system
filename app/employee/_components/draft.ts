import { tickets } from "@/lib/data";
import type { Ticket } from "@/lib/types";
import type { TicketDraft } from "./ticket-wizard";

export const emptyDraft: TicketDraft = {
  title: "",
  clientId: "",
  category: "",
  priority: "medium",
  startDate: "",
  endDate: "",
  description: "",
  subtasks: [],
  participantIds: [],
  attachments: [],
};

export function ticketToDraft(ticket: Ticket): TicketDraft {
  return {
    title: ticket.title,
    clientId: ticket.clientId,
    category: ticket.category,
    priority: ticket.priority,
    startDate: ticket.startDate,
    endDate: ticket.endDate,
    description: ticket.description,
    subtasks: ticket.subtasks.map((s) => ({
      key: s.id,
      title: s.title,
      description: s.description,
      assigneeId: s.assigneeIds[0] ?? ticket.ownerId,
      estimate: s.estimate,
    })),
    participantIds: ticket.participantIds,
    attachments: ticket.attachments.map((a) => ({ key: a.id, name: a.name, size: a.size })),
  };
}

/** The id the next created ticket will receive (mock sequence). */
export function nextTicketId() {
  const max = Math.max(...tickets.map((t) => Number(t.id.replace("TKT-", ""))));
  return `TKT-${max + 1}`;
}
