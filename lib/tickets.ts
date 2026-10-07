import { clients, employees, tickets } from "./data";
import { publicJobUrl } from "./public-links";
import type { Employee, Ticket } from "./types";

/* Server-side lookups over the mock data. Pure helpers live in ./format so
 * client components can use them without bundling the dataset. */
export * from "./format";

/* ---------------------------------------------------------------- lookups */

export function getTicket(id: string) {
  return tickets.find((t) => t.id === id);
}

export function getTicketByJobId(jobId: string) {
  return tickets.find((t) => t.jobId === jobId);
}

export function getTicketByPublicToken(publicToken: string) {
  return tickets.find((t) => publicToken === `demo-${t.jobId}`);
}

export function customerJobUrl(ticket: Ticket) {
  return publicJobUrl(ticket.publicToken ?? `demo-${ticket.jobId}`);
}

export function getEmployee(id: string) {
  return employees.find((e) => e.id === id);
}

export function getClient(id: string) {
  return clients.find((c) => c.id === id);
}

/** Everyone working on a ticket: the current holder first, then participants. */
export function ticketCrew(ticket: Ticket): Employee[] {
  return [ticket.ownerId, ...ticket.participantIds.filter((id) => id !== ticket.ownerId)]
    .map(getEmployee)
    .filter((e): e is Employee => Boolean(e));
}

export function ticketsForEmployee(employeeId: string) {
  return tickets.filter(
    (t) => t.ownerId === employeeId || t.createdById === employeeId || t.participantIds.includes(employeeId),
  );
}

export function ticketsForClient(clientId: string) {
  return tickets.filter((t) => t.clientId === clientId);
}
