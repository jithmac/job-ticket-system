import { publicJobUrl } from "./public-links";
import {
  getClient,
  getEmployee,
  getTicket,
  getTicketByJobId,
  getTicketsForClient,
  getTicketsForEmployee,
} from "./db-data";
import type { Ticket } from "./types";

export * from "./format";
export { getClient, getEmployee, getTicket, getTicketByJobId };

export function customerJobUrl(ticket: Ticket) {
  return publicJobUrl(ticket.publicToken ?? `demo-${ticket.jobId}`);
}

export async function ticketCrew(ticket: Ticket) {
  const ids = [ticket.ownerId, ...ticket.participantIds.filter((id) => id !== ticket.ownerId)];
  const crew = await Promise.all(ids.map((id) => getEmployee(id)));
  return crew.filter((employee): employee is NonNullable<typeof employee> => Boolean(employee));
}

export { getTicketsForClient as ticketsForClient, getTicketsForEmployee as ticketsForEmployee };
