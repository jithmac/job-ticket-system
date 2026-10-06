import type { Billing, Employee, Priority, Subtask, Ticket, TicketStatus } from "./types";

/** "Today" for the mock data, so countdowns render the same on server and client. */
export const REFERENCE_DATE = "2026-10-04T12:00:00";

const DAY_MS = 24 * 60 * 60 * 1000;

/* --------------------------------------------------------------- progress */

export function subtaskProgress(subtask: Subtask) {
  if (subtask.status === "done") return 100;
  if (subtask.status === "pending") return 0;
  return subtask.progress;
}

export function ticketProgress(ticket: Pick<Ticket, "subtasks">) {
  if (ticket.subtasks.length === 0) return 0;
  const total = ticket.subtasks.reduce((sum, s) => sum + subtaskProgress(s), 0);
  return Math.round(total / ticket.subtasks.length);
}

/** Index of the subtask currently being worked on (first one not done). */
export function activeSubtaskIndex(ticket: Pick<Ticket, "subtasks">) {
  return ticket.subtasks.findIndex((s) => s.status !== "done");
}

/* ------------------------------------------------------------------ dates */

export function daysRemaining(ticket: Pick<Ticket, "endDate">) {
  const end = new Date(`${ticket.endDate}T23:59:59`).getTime();
  return Math.ceil((end - new Date(REFERENCE_DATE).getTime()) / DAY_MS);
}

export function isOverdue(ticket: Ticket) {
  return ticket.status !== "completed" && daysRemaining(ticket) < 0;
}

export function remainingLabel(ticket: Ticket) {
  if (ticket.status === "completed") return "Completed";
  const days = daysRemaining(ticket);
  if (days < 0) return `Overdue by ${Math.abs(days)}d`;
  if (days === 0) return "Due today";
  if (days <= 3) return `${days * 24} hours remaining`;
  return `${days} days remaining`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Deterministic formatting (no locale differences between server and client). */
export function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${MONTHS[m - 1]} ${String(d).padStart(2, "0")}, ${y}`;
}

export function formatTime(iso: string) {
  const [h, min] = iso.slice(11, 16).split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")} ${suffix}`;
}

export function formatDateTime(iso: string) {
  return `${formatDate(iso)} • ${formatTime(iso)}`;
}

export function formatMoney(amount: number) {
  const [whole, cents] = amount.toFixed(2).split(".");
  return `$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${cents}`;
}

/* ---------------------------------------------------------------- billing */

export function billTotals(billing: Billing) {
  const subtotal = billing.lines.reduce((sum, l) => sum + l.qty * l.rate, 0);
  const tax = subtotal * billing.taxRate;
  return { subtotal, tax, total: subtotal + tax };
}

/* ------------------------------------------------------------------ labels */

export const priorityLabel: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const priorityOrder: Priority[] = ["low", "medium", "high", "critical"];

export const statusLabel: Record<TicketStatus, string> = {
  draft: "Draft",
  open: "Open",
  in_progress: "In Progress",
  on_hold: "On Hold",
  awaiting_signoff: "Awaiting Sign-Off",
  completed: "Completed",
};

export const employeeStatusLabel: Record<Employee["status"], string> = {
  on_site: "On-Site",
  in_transit: "In Transit",
  available: "Available",
  remote: "Remote",
  off_duty: "Off Duty",
};

export function phaseLabel(index: number) {
  return `Phase ${String(index + 1).padStart(2, "0")}`;
}

/** Urgency score used to sort desks/queues. */
export function urgency(ticket: Ticket) {
  if (ticket.status === "completed") return -1;
  return priorityOrder.indexOf(ticket.priority) * 100 - daysRemaining(ticket);
}
