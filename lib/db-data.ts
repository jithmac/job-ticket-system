import { Prisma, UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import type { Attachment, Client, Employee, Ticket } from "@/lib/types";

export const currentEmployeeId = "EMP-402";
export const currentClientId = "CL-1001";
export const careAgentId = "CC-441";
export const adminUserId = "ADMIN-001";

const ticketInclude = {
  crew: { include: { user: true } },
  subtasks: { include: { assignees: true } },
  attachments: true,
  activities: true,
  priorityRequests: true,
  billing: { include: { lines: true } },
  customer: true,
} satisfies Prisma.TicketInclude;

type DbTicket = Prisma.TicketGetPayload<{ include: typeof ticketInclude }>;

function date(value: Date | null | undefined) {
  return value ? value.toISOString() : "";
}

function employee(user: DbTicket["crew"][number]["user"]): Employee {
  return {
    id: user.id,
    name: user.name,
    initials: user.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    title: user.title ?? "",
    department: user.department ?? "",
    skillLevel: user.title ?? "",
    email: user.email,
    phone: user.phone ?? "",
    status: "available",
    location: "HQ Dispatch",
    joinedOn: date(user.createdAt).slice(0, 10),
  };
}

function client(customer: DbTicket["customer"]): Client {
  return {
    id: customer.id,
    name: customer.name,
    facility: customer.facility,
    address: customer.address,
    contractRef: customer.contractRef,
    tier: customer.tier,
    contactName: customer.contactName,
    contactRole: customer.contactRole,
    contactEmail: customer.contactEmail,
    contactPhone: customer.contactPhone,
    accessLevel: customer.accessLevel,
    safetyProtocol: customer.safetyProtocol,
  };
}

function mapTicket(ticket: DbTicket): Ticket {
  const participants = ticket.crew.filter((member) => member.userId !== ticket.ownerId);

  return {
    id: ticket.id,
    jobId: ticket.jobId,
    publicToken: ticket.publicToken,
    title: ticket.title,
    assetTag: ticket.assetTag,
    clientId: ticket.customerId,
    createdById: ticket.createdById,
    ownerId: ticket.ownerId,
    participantIds: participants.map((member) => member.userId),
    startDate: date(ticket.startDate),
    endDate: date(ticket.endDate),
    description: ticket.description,
    priority: ticket.priority.toLowerCase() as Ticket["priority"],
    category: ticket.category as Ticket["category"],
    status: ticket.status.toLowerCase() as Ticket["status"],
    subtasks: ticket.subtasks.map((subtask) => ({
      id: subtask.id,
      title: subtask.title,
      description: subtask.description,
      assigneeIds: subtask.assignees.map((assignee) => assignee.userId),
      estimate: subtask.estimate,
      status: subtask.status.toLowerCase() as Ticket["subtasks"][number]["status"],
      progress: subtask.progress,
      dueDate: date(subtask.dueDate) || undefined,
      completedAt: date(subtask.completedAt) || undefined,
    })),
    attachments: ticket.attachments.map((attachment): Attachment => ({
      id: attachment.id,
      name: attachment.name,
      size: attachment.size,
      kind: attachment.kind as Attachment["kind"],
      label: attachment.label,
    })),
    activity: ticket.activities.map((activity) => ({
      id: activity.id,
      kind: activity.kind.toLowerCase().replace("_", "-") as Ticket["activity"][number]["kind"],
      authorId: activity.authorId ?? undefined,
      authorName: activity.authorName,
      authorRole: activity.authorRole,
      at: date(activity.at),
      text: activity.text,
      visibleToEmployees: activity.visibleToEmployees,
    })),
    priorityRequests: ticket.priorityRequests.map((request) => ({
      id: request.id,
      from: request.from.toLowerCase() as Ticket["priorityRequests"][number]["from"],
      to: request.to.toLowerCase() as Ticket["priorityRequests"][number]["to"],
      reason: request.reason,
      requestedBy: request.requestedBy,
      at: date(request.at),
      status: request.status as Ticket["priorityRequests"][number]["status"],
    })),
    billing: ticket.billing
      ? {
          invoiceId: ticket.billing.invoiceId,
          issuedOn: date(ticket.billing.issuedOn),
          dueDate: date(ticket.billing.dueDate),
          taxRate: Number(ticket.billing.taxRate),
          lines: ticket.billing.lines.map((line) => ({
            description: line.description,
            qty: Number(line.qty),
            unit: line.unit,
            rate: Number(line.rate),
          })),
        }
      : undefined,
    updatedAt: date(ticket.updatedAt),
  };
}

export async function getEmployees(): Promise<Employee[]> {
  const users = await db.user.findMany({ where: { role: UserRole.EMPLOYEE }, orderBy: { name: "asc" } });
  return users.map(employee);
}

export async function getEmployee(id: string) {
  const user = await db.user.findUnique({ where: { id } });
  return user && user.role === UserRole.EMPLOYEE ? employee(user) : undefined;
}

export async function getClients(): Promise<Client[]> {
  const customers = await db.customer.findMany({ orderBy: { name: "asc" } });
  return customers.map((item) => client(item as DbTicket["customer"]));
}

export async function getClient(id: string) {
  const item = await db.customer.findUnique({ where: { id } });
  return item ? client(item) : undefined;
}

export async function getTickets(): Promise<Ticket[]> {
  const rows = await db.ticket.findMany({ include: ticketInclude, orderBy: { updatedAt: "desc" } });
  return rows.map(mapTicket);
}

export async function getTicket(id: string) {
  const row = await db.ticket.findUnique({ where: { id }, include: ticketInclude });
  return row ? mapTicket(row) : undefined;
}

export async function getTicketByJobId(jobId: string) {
  const row = await db.ticket.findUnique({ where: { jobId }, include: ticketInclude });
  return row ? mapTicket(row) : undefined;
}

export async function getTicketByPublicToken(publicToken: string) {
  const row = await db.ticket.findUnique({ where: { publicToken }, include: ticketInclude });
  return row ? mapTicket(row) : undefined;
}

export async function getTicketsForEmployee(employeeId: string) {
  const rows = await db.ticket.findMany({
    where: { OR: [{ ownerId: employeeId }, { createdById: employeeId }, { crew: { some: { userId: employeeId } } }] },
    include: ticketInclude,
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapTicket);
}

export async function getTicketsForClient(clientId: string) {
  const rows = await db.ticket.findMany({ where: { customerId: clientId }, include: ticketInclude, orderBy: { endDate: "asc" } });
  return rows.map(mapTicket);
}

export async function getCareAgent() {
  const user = await db.user.findUnique({ where: { id: careAgentId } });
  return { id: careAgentId, name: user?.name ?? "Customer Care", role: user?.title ?? "Customer Care Dispatcher" };
}

export async function getAdminUser() {
  const user = await db.user.findUnique({ where: { id: adminUserId } });
  return { name: user?.name ?? "Administrator", role: user?.title ?? "Operations Lead", avatarUrl: "" };
}

export const categories = [
  "Mechanical / Calibration",
  "Electrical / Power",
  "Controls & SCADA",
  "Hydraulics & Pneumatics",
  "HVAC",
  "Safety & Compliance",
] as const;

export const departments = ["Field Operations", "Infrastructure", "Hardware Telemetry", "Field Safety", "Network Operations"] as const;
export const skillLevels = ["Level 1 Field Tech", "Level 2 Diagnostics", "Level 3 Diagnostics", "Senior Engineer", "Supervisor"] as const;
