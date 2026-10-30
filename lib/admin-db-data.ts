import { Prisma, TicketStatus as PrismaTicketStatus, UserRole } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";
import type { EmployeeStatus, Priority, SubtaskStatus, TicketStatus } from "@/lib/types";

const adminUserId = "ADMIN-001";

const adminUserSelect = {
  name: true,
  title: true,
} satisfies Prisma.UserSelect;

const overviewTicketSelect = {
  id: true,
  title: true,
  priority: true,
  status: true,
  endDate: true,
  owner: { select: { name: true } },
  customer: { select: { name: true } },
  subtasks: {
    select: {
      id: true,
      title: true,
      status: true,
      progress: true,
      completedAt: true,
    },
  },
} satisfies Prisma.TicketSelect;

const overviewPriorityRequestSelect = {
  id: true,
  customerCareId: true,
  from: true,
  to: true,
  status: true,
  ticket: { select: { id: true } },
} satisfies Prisma.PriorityRequestSelect;

const overviewActivitySelect = {
  id: true,
  ticketId: true,
  authorName: true,
  at: true,
  text: true,
} satisfies Prisma.ActivitySelect;

export type AdminOverviewTicket = {
  id: string;
  title: string;
  priority: Priority;
  status: TicketStatus;
  endDate: string;
  ownerName: string;
  clientName: string;
  subtasks: Array<{
    id: string;
    title: string;
    status: SubtaskStatus;
    progress: number;
    completedAt?: string;
  }>;
};

export type AdminOverviewCrewMember = {
  id: string;
  name: string;
  title: string;
  status: EmployeeStatus;
};

export type AdminOverviewData = {
  clientCount: number;
  employeeCount: number;
  ticketCount: number;
  tickets: AdminOverviewTicket[];
  priorityRequests: Array<{
    id: string;
    customerCareId?: string;
    ticketId: string;
    from: Priority;
    to: Priority;
    status: string;
  }>;
  recentActivity: Array<{
    id: string;
    ticketId: string;
    authorName: string;
    at: string;
    text: string;
  }>;
  crew: AdminOverviewCrewMember[];
};

function enumValue<T extends string>(value: string): T {
  return value.toLowerCase() as T;
}

const getAdminOverviewCached = unstable_cache(
  async (): Promise<AdminOverviewData> => {
    const [clientCount, employeeCount, ticketCount, tickets, priorityRequests, recentActivity, crew] = await Promise.all([
      db.customer.count(),
      db.user.count({ where: { role: UserRole.EMPLOYEE } }),
      db.ticket.count(),
      db.ticket.findMany({
        where: { status: { not: PrismaTicketStatus.COMPLETED } },
        select: overviewTicketSelect,
        orderBy: { endDate: "asc" },
      }),
      db.priorityRequest.findMany({
        select: overviewPriorityRequestSelect,
        orderBy: { at: "desc" },
      }),
      db.activity.findMany({
        select: overviewActivitySelect,
        orderBy: { at: "desc" },
        take: 5,
      }),
      db.user.findMany({
        where: { role: UserRole.EMPLOYEE },
        select: { id: true, name: true, title: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      clientCount,
      employeeCount,
      ticketCount,
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        title: ticket.title,
        priority: enumValue<Priority>(ticket.priority),
        status: enumValue<TicketStatus>(ticket.status),
        endDate: ticket.endDate.toISOString(),
        ownerName: ticket.owner.name,
        clientName: ticket.customer.name,
        subtasks: ticket.subtasks.map((subtask) => ({
          id: subtask.id,
          title: subtask.title,
          status: enumValue<SubtaskStatus>(subtask.status),
          progress: subtask.progress,
          ...(subtask.completedAt ? { completedAt: subtask.completedAt.toISOString() } : {}),
        })),
      })),
      priorityRequests: priorityRequests.map((request) => ({
        id: request.id,
        customerCareId: request.customerCareId ?? undefined,
        ticketId: request.ticket.id,
        from: enumValue<Priority>(request.from),
        to: enumValue<Priority>(request.to),
        status: request.status,
      })),
      recentActivity: recentActivity.map((activity) => ({
        id: activity.id,
        ticketId: activity.ticketId,
        authorName: activity.authorName,
        at: activity.at.toISOString(),
        text: activity.text,
      })),
      crew: crew.map((user) => ({
        id: user.id,
        name: user.name,
        title: user.title ?? "",
        status: "available",
      })),
    };
  },
  ["admin-overview"],
  { revalidate: 30, tags: ["admin-overview"] },
);

const getAdminUserCached = unstable_cache(
  async () => db.user.findUnique({ where: { id: adminUserId }, select: adminUserSelect }),
  ["admin-user"],
  { revalidate: 60, tags: ["admin-user"] },
);

export async function getAdminOverview() {
  return getAdminOverviewCached();
}

export async function getAdminUser() {
  const user = await getAdminUserCached();
  return { name: user?.name ?? "Administrator", role: user?.title ?? "Operations Lead" };
}
