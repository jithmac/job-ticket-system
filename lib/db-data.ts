// This file hadnles all the data fetching and converting currently
// If the system get bigger then this single file needs devide according to the domain. 
// It has reusable queries and data conversion functions that can be used in the API routes and server components


import { Prisma, UserRole } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db } from "@/lib/db";
import type { Attachment, Client, Employee, EmployeeDashboardTicket, HandoverNote, Ticket } from "@/lib/types";

export const currentEmployeeId = "EMP-402";
export const currentClientId = "CL-1001";
export const careAgentId = "CC-441";

const employeeSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  title: true,
  department: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const clientSelect = {
  id: true,
  name: true,
  facility: true,
  address: true,
  contractRef: true,
  tier: true,
  contactName: true,
  contactRole: true,
  contactEmail: true,
  contactPhone: true,
  accessLevel: true,
  safetyProtocol: true,
} satisfies Prisma.CustomerSelect;

const attachmentMetadataSelect = {
  id: true,
  name: true,
  size: true,
  kind: true,
  label: true,
} satisfies Prisma.AttachmentSelect;

const ticketInclude = {
  crew: { include: { user: { select: employeeSelect } } },
  subtasks: { include: { assignees: true } },
  attachments: { select: attachmentMetadataSelect },
  activities: true,
  handovers: { include: { fromUser: { select: { name: true } }, toUser: { select: { name: true } } } },
  priorityRequests: true,
  billing: { include: { lines: true } },
  customer: { select: clientSelect },
} satisfies Prisma.TicketInclude;

const employeeTicketInclude = {
  crew: { include: { user: { select: employeeSelect } } },
  subtasks: { include: { assignees: true } },
  attachments: { select: attachmentMetadataSelect },
  activities: true,
  handovers: { include: { fromUser: { select: { name: true } }, toUser: { select: { name: true } } } },
  priorityRequests: true,
} satisfies Prisma.TicketInclude;

const relationLoadStrategy = "join" as const;

type DbTicket = Prisma.TicketGetPayload<{ include: typeof ticketInclude }>;
type DbEmployeeTicket = Prisma.TicketGetPayload<{ include: typeof employeeTicketInclude }>;
type EmployeeUser = Prisma.UserGetPayload<{ select: typeof employeeSelect }>;
type ClientRecord = Prisma.CustomerGetPayload<{ select: typeof clientSelect }>;

function date(value: Date | string | null | undefined) {
  if (!value) return "";
  return typeof value === "string" ? value : value.toISOString();
}

function employee(user: EmployeeUser): Employee {
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

function client(customer: ClientRecord): Client {
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

function mapTicket(ticket: DbTicket | DbEmployeeTicket): Ticket {
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
    pendingParticipantIds: participants.filter((member) => !member.canOpen).map((member) => member.userId),
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
    handoverNotes: ticket.handovers.map((handover): HandoverNote => ({
      id: handover.id,
      fromUserId: handover.fromUserId,
      fromName: handover.fromUser.name,
      toUserId: handover.toUserId,
      toName: handover.toUser.name,
      note: handover.note ?? "",
      at: date(handover.createdAt),
    })),
    priorityRequests: ticket.priorityRequests.map((request) => ({
      id: request.id,
      from: request.from.toLowerCase() as Ticket["priorityRequests"][number]["from"],
      to: request.to.toLowerCase() as Ticket["priorityRequests"][number]["to"],
      reason: request.reason,
      customerCareId: request.customerCareId ?? undefined,
      requestedBy: request.requestedBy,
      at: date(request.at),
      status: request.status as Ticket["priorityRequests"][number]["status"],
    })),
    billing: "billing" in ticket && ticket.billing
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
  const users = await getEmployeesCached();
  return users.map(employee);
}

const getEmployeesCached = unstable_cache(
  async () => db.user.findMany({ where: { role: UserRole.EMPLOYEE }, orderBy: { name: "asc" }, select: employeeSelect }),
  ["employees"],
  { revalidate: 60, tags: ["employees"] },
);

const getEmployeeCached = unstable_cache(
  async (id: string) => db.user.findUnique({ where: { id }, select: employeeSelect }),
  ["employee"],
  { revalidate: 60, tags: ["employees"] },
);

export const getEmployee = cache(async (id: string) => {
  const user = await getEmployeeCached(id);
  return user && user.role === UserRole.EMPLOYEE ? employee(user) : undefined;
});

export async function getClients(): Promise<Client[]> {
  const customers = await getClientsCached();
  return customers.map(client);
}

export async function getLiveTicketWizardOptions(): Promise<{ clients: Client[]; employees: Employee[] }> {
  const customers = await db.customer.findMany({ orderBy: { name: "asc" }, select: clientSelect });
  if (customers.length === 0) throw new Error("No customers are available for ticket creation.");

  const users = await db.user.findMany({ where: { role: UserRole.EMPLOYEE }, orderBy: { name: "asc" }, select: employeeSelect });
  return { clients: customers.map(client), employees: users.map(employee) };
}

const getClientsCached = unstable_cache(
  async () => db.customer.findMany({ orderBy: { name: "asc" }, select: clientSelect }),
  ["clients"],
  { revalidate: 60, tags: ["clients"] },
);

export async function getClient(id: string) {
  const item = await getClientCached(id);
  return item ? client(item) : undefined;
}

const getClientCached = unstable_cache(
  async (id: string) => db.customer.findUnique({ where: { id }, select: clientSelect }),
  ["client"],
  { revalidate: 60, tags: ["clients"] },
);

export async function getTickets(): Promise<Ticket[]> {
  return getTicketsCached();
}

const getTicketsCached = unstable_cache(
  async () => {
    const rows = await db.ticket.findMany({ relationLoadStrategy, include: ticketInclude, orderBy: { updatedAt: "desc" } });
    return rows.map(mapTicket);
  },
  ["tickets"],
  { revalidate: 30, tags: ["tickets"] },
);

const getTicketCached = unstable_cache(
  async (id: string) => {
    const row = await db.ticket.findUnique({ where: { id }, relationLoadStrategy, include: ticketInclude });
    return row ? mapTicket(row) : undefined;
  },
  ["ticket"],
  { revalidate: 30, tags: ["tickets"] },
);

export const getTicket = cache(async (id: string) => {
  const row = await getTicketCached(id);
  return row;
});

const getEmployeeTicketCached = unstable_cache(
  async (id: string) => {
    const row = await db.ticket.findUnique({ where: { id }, relationLoadStrategy, include: employeeTicketInclude });
    return row ? mapTicket(row) : undefined;
  },
  ["employee-ticket"],
  { revalidate: 30, tags: ["employee-tickets"] },
);

export const getEmployeeTicket = cache(async (id: string) => {
  const row = await getEmployeeTicketCached(id);
  return row;
});

const getTicketByJobIdCached = unstable_cache(
  async (jobId: string) => {
    const row = await db.ticket.findUnique({ where: { jobId }, relationLoadStrategy, include: ticketInclude });
    return row ? mapTicket(row) : undefined;
  },
  ["ticket-by-job-id"],
  { revalidate: 30, tags: ["tickets"] },
);

export const getTicketByJobId = cache((jobId: string) => getTicketByJobIdCached(jobId));

const getTicketByPublicTokenCached = unstable_cache(
  async (publicToken: string) => {
    const row = await db.ticket.findUnique({ where: { publicToken }, relationLoadStrategy, include: ticketInclude });
    return row ? mapTicket(row) : undefined;
  },
  ["ticket-by-public-token"],
  { revalidate: 30, tags: ["tickets"] },
);

export const getTicketByPublicToken = cache((publicToken: string) => getTicketByPublicTokenCached(publicToken));

const getTicketsForEmployeeCached = unstable_cache(
  async (employeeId: string) => {
    const rows = await db.ticket.findMany({
      where: { OR: [{ ownerId: employeeId }, { createdById: employeeId }, { crew: { some: { userId: employeeId } } }] },
      relationLoadStrategy,
      include: ticketInclude,
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(mapTicket);
  },
  ["employee-tickets"],
  { revalidate: 30, tags: ["tickets"] },
);

export const getTicketsForEmployee = cache((employeeId: string) => getTicketsForEmployeeCached(employeeId));

export type EmployeeTicketListItem = {
  id: string;
  jobId: string;
  title: string;
  clientId: string;
  clientName: string;
  createdById: string;
  ownerId: string;
  ownerName: string;
  startDate: string;
  endDate: string;
  priority: Ticket["priority"];
  status: Ticket["status"];
  subtasks: Array<Pick<Ticket["subtasks"][number], "status" | "progress">>;
  pendingAssignment: boolean;
};

const getEmployeeTicketListCached = unstable_cache(
  async (employeeId: string): Promise<EmployeeTicketListItem[]> => {
    const rows = await db.ticket.findMany({
      // Below conditions are used to fetch data related to the relavant employee.
      where: { 
        OR: [
          { ownerId: employeeId }, 
          { createdById: employeeId }, 
          { crew: { some: { userId: employeeId } } }
        ] 
      },

      orderBy: { updatedAt: "desc" },

      select: {
        id: true,
        jobId: true,
        title: true,
        customerId: true,
        createdById: true,
        ownerId: true,
        startDate: true,
        endDate: true,
        priority: true,
        status: true,
        owner: { 
          select: { name: true } 
        },
        customer: { 
          select: { name: true } 
        },
        crew: {
          // Fetch the crew members for the specific employee
          where: { userId: employeeId },
          select: { canOpen: true } 
        },
        subtasks: { 
          select: { status: true, progress: true } 
        },
      },
    });

    return rows.map((ticket) => ({
      id: ticket.id,
      jobId: ticket.jobId,
      title: ticket.title,
      clientId: ticket.customerId,
      clientName: ticket.customer.name,
      createdById: ticket.createdById,
      ownerId: ticket.ownerId,
      ownerName: ticket.owner.name,
      startDate: date(ticket.startDate),
      endDate: date(ticket.endDate),
      priority: ticket.priority.toLowerCase() as EmployeeTicketListItem["priority"],
      status: ticket.status.toLowerCase() as EmployeeTicketListItem["status"],
      subtasks: ticket.subtasks.map((subtask) => ({
        status: subtask.status.toLowerCase() as EmployeeTicketListItem["subtasks"][number]["status"],
        progress: subtask.progress,
      })),
      pendingAssignment: ticket.ownerId !== employeeId &&
        ticket.createdById !== employeeId &&
        ticket.crew.some((member) => !member.canOpen),
    }));
  },
  ["employee-ticket-list"],
  { revalidate: 30, tags: ["tickets"] },
);

export const getEmployeeTicketList = cache((employeeId: string) => getEmployeeTicketListCached(employeeId));

const getEmployeeDashboardCached = unstable_cache(
  async (employeeId: string): Promise<EmployeeDashboardTicket[]> => {
    const rows = await db.ticket.findMany({
      where: { OR: [{ ownerId: employeeId }, { createdById: employeeId }, { crew: { some: { userId: employeeId } } }] },
      relationLoadStrategy,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        jobId: true,
        title: true,
        customerId: true,
        createdById: true,
        ownerId: true,
        startDate: true,
        endDate: true,
        priority: true,
        status: true,
        updatedAt: true,
        customer: { select: { name: true } },
        crew: { where: { userId: employeeId }, select: { canOpen: true } },
        subtasks: {
          select: {
            id: true,
            title: true,
            estimate: true,
            status: true,
            progress: true,
            assignees: { where: { userId: employeeId }, select: { userId: true } },
          },
        },
        activities: {
          where: { kind: "CUSTOMER_CARE", visibleToEmployees: true },
          select: { id: true, kind: true, authorName: true, at: true, text: true, visibleToEmployees: true },
          orderBy: { at: "desc" },
        },
      },
    });

    return rows.map((ticket) => ({
      id: ticket.id,
      jobId: ticket.jobId,
      title: ticket.title,
      clientId: ticket.customerId,
      clientName: ticket.customer.name,
      createdById: ticket.createdById,
      ownerId: ticket.ownerId,
      startDate: date(ticket.startDate),
      endDate: date(ticket.endDate),
      priority: ticket.priority.toLowerCase() as EmployeeDashboardTicket["priority"],
      status: ticket.status.toLowerCase() as EmployeeDashboardTicket["status"],
      subtasks: ticket.subtasks.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        estimate: subtask.estimate,
        status: subtask.status.toLowerCase() as EmployeeDashboardTicket["subtasks"][number]["status"],
        progress: subtask.progress,
        assigneeIds: subtask.assignees.map((assignee) => assignee.userId),
      })),
      activity: ticket.activities.map((activity) => ({
        id: activity.id,
        kind: activity.kind.toLowerCase().replace("_", "-") as EmployeeDashboardTicket["activity"][number]["kind"],
        authorName: activity.authorName,
        at: date(activity.at),
        text: activity.text,
        visibleToEmployees: activity.visibleToEmployees,
      })),
      pendingAssignment: ticket.ownerId !== employeeId &&
        ticket.createdById !== employeeId &&
        ticket.crew.some((member) => !member.canOpen),
      updatedAt: date(ticket.updatedAt),
    }));
  },
  ["employee-dashboard"],
  { revalidate: 30, tags: ["tickets"] },
);

export const getEmployeeDashboard = cache((employeeId: string) => getEmployeeDashboardCached(employeeId));

const getTicketsForClientCached = unstable_cache(
  async (clientId: string) => {
    const rows = await db.ticket.findMany({
      where: { customerId: clientId },
      relationLoadStrategy,
      include: ticketInclude,
      orderBy: { endDate: "asc" },
    });
    return rows.map(mapTicket);
  },
  ["client-tickets"],
  { revalidate: 30, tags: ["tickets"] },
);

export const getTicketsForClient = cache((clientId: string) => getTicketsForClientCached(clientId));

const getCareAgentCached = unstable_cache(
  async () => db.user.findUnique({ where: { id: careAgentId }, select: { name: true, title: true } }),
  ["care-agent"],
  { revalidate: 60, tags: ["employees"] },
);

export async function getCareAgent() {
  const user = await getCareAgentCached();
  return { id: careAgentId, name: user?.name ?? "Customer Care", role: user?.title ?? "Customer Care Dispatcher" };
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
