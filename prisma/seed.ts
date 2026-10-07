import { PrismaClient, Priority, TicketStatus, UserRole } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";
import { clients, employees, tickets } from "../lib/data";
import { createPublicJobToken } from "../lib/public-links";

const db = new PrismaClient();
const ADMIN_ID = "ADMIN-001";
const ADMIN_EMAIL = "admin@apexindustrial.com";

function asDate(value: string) {
  return new Date(value.includes("T") ? value : `${value}T00:00:00.000Z`);
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

function requiredAdminPassword() {
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error("Set ADMIN_INITIAL_PASSWORD to a value with at least 12 characters before running the seed.");
  }
  return password;
}

async function main() {
  const adminPassword = requiredAdminPassword();

  await db.user.upsert({
    where: { id: ADMIN_ID },
    update: {
      name: "Alex Mercer",
      email: ADMIN_EMAIL,
      title: "Operations Lead",
      department: "Operations",
      role: UserRole.ADMIN,
      passwordHash: hashPassword(adminPassword),
    },
    create: {
      id: ADMIN_ID,
      name: "Alex Mercer",
      email: ADMIN_EMAIL,
      title: "Operations Lead",
      department: "Operations",
      role: UserRole.ADMIN,
      passwordHash: hashPassword(adminPassword),
    },
  });

  for (const employee of employees) {
    await db.user.upsert({
      where: { id: employee.id },
      update: {
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        title: employee.title,
        department: employee.department,
        role: UserRole.EMPLOYEE,
      },
      create: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        title: employee.title,
        department: employee.department,
        role: UserRole.EMPLOYEE,
      },
    });
  }

  await db.user.upsert({
    where: { id: "CC-441" },
    update: { name: "Nadia Perera", email: "nadia.perera@apexindustrial.com", title: "Customer Care Dispatcher", role: UserRole.CARE },
    create: {
      id: "CC-441",
      name: "Nadia Perera",
      email: "nadia.perera@apexindustrial.com",
      title: "Customer Care Dispatcher",
      role: UserRole.CARE,
    },
  });

  for (const client of clients) {
    await db.customer.upsert({
      where: { id: client.id },
      update: client,
      create: { ...client },
    });
  }

  for (const ticket of tickets) {
    await db.ticket.upsert({
      where: { id: ticket.id },
      update: {
        jobId: ticket.jobId,
        title: ticket.title,
        assetTag: ticket.assetTag,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority.toUpperCase() as Priority,
        status: ticket.status.toUpperCase() as TicketStatus,
        startDate: asDate(ticket.startDate),
        endDate: asDate(ticket.endDate),
        createdById: ticket.createdById,
        ownerId: ticket.ownerId,
        customerId: ticket.clientId,
      },
      create: {
        id: ticket.id,
        jobId: ticket.jobId,
        publicToken: createPublicJobToken(),
        title: ticket.title,
        assetTag: ticket.assetTag,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority.toUpperCase() as Priority,
        status: ticket.status.toUpperCase() as TicketStatus,
        startDate: asDate(ticket.startDate),
        endDate: asDate(ticket.endDate),
        createdById: ticket.createdById,
        ownerId: ticket.ownerId,
        customerId: ticket.clientId,
      },
    });

    for (const participantId of [ticket.ownerId, ...ticket.participantIds]) {
      await db.ticketCrew.upsert({
        where: { ticketId_userId: { ticketId: ticket.id, userId: participantId } },
        update: {},
        create: { ticketId: ticket.id, userId: participantId },
      });
    }

    for (const subtask of ticket.subtasks) {
      const subtaskId = `${ticket.id}-${subtask.id}`;
      await db.subtask.upsert({
        where: { id: subtaskId },
        update: {
          ticketId: ticket.id,
          title: subtask.title,
          description: subtask.description,
          estimate: subtask.estimate,
          status: subtask.status.toUpperCase() as "PENDING" | "IN_PROGRESS" | "DONE",
          progress: subtask.progress,
          dueDate: subtask.dueDate ? asDate(subtask.dueDate) : null,
          completedAt: subtask.completedAt ? asDate(subtask.completedAt) : null,
        },
        create: {
          id: subtaskId,
          ticketId: ticket.id,
          title: subtask.title,
          description: subtask.description,
          estimate: subtask.estimate,
          status: subtask.status.toUpperCase() as "PENDING" | "IN_PROGRESS" | "DONE",
          progress: subtask.progress,
          dueDate: subtask.dueDate ? asDate(subtask.dueDate) : null,
          completedAt: subtask.completedAt ? asDate(subtask.completedAt) : null,
        },
      });

      for (const userId of subtask.assigneeIds) {
        await db.subtaskAssignee.upsert({
          where: { subtaskId_userId: { subtaskId: subtaskId, userId } },
          update: {},
          create: { subtaskId: subtaskId, userId },
        });
      }
    }

    for (const attachment of ticket.attachments) {
      await db.attachment.upsert({
        where: { id: `${ticket.id}-${attachment.id}` },
        update: { ticketId: ticket.id, name: attachment.name, size: attachment.size, kind: attachment.kind, label: attachment.label },
        create: { id: `${ticket.id}-${attachment.id}`, ticketId: ticket.id, name: attachment.name, size: attachment.size, kind: attachment.kind, label: attachment.label },
      });
    }

    for (const activity of ticket.activity) {
      await db.activity.upsert({
        where: { id: `${ticket.id}-${activity.id}` },
        update: {
          ticketId: ticket.id,
          kind: activity.kind.toUpperCase().replace("-", "_") as "SYSTEM" | "EMPLOYEE" | "CUSTOMER_CARE" | "ADMIN",
          authorId: activity.authorId ?? null,
          authorName: activity.authorName,
          authorRole: activity.authorRole,
          text: activity.text,
          visibleToEmployees: activity.visibleToEmployees,
          at: asDate(activity.at),
        },
        create: {
          id: `${ticket.id}-${activity.id}`,
          ticketId: ticket.id,
          kind: activity.kind.toUpperCase().replace("-", "_") as "SYSTEM" | "EMPLOYEE" | "CUSTOMER_CARE" | "ADMIN",
          authorId: activity.authorId ?? null,
          authorName: activity.authorName,
          authorRole: activity.authorRole,
          text: activity.text,
          visibleToEmployees: activity.visibleToEmployees,
          at: asDate(activity.at),
        },
      });
    }

    for (const request of ticket.priorityRequests) {
      await db.priorityRequest.upsert({
        where: { id: `${ticket.id}-${request.id}` },
        update: {
          ticketId: ticket.id,
          from: request.from.toUpperCase() as Priority,
          to: request.to.toUpperCase() as Priority,
          reason: request.reason,
          requestedBy: request.requestedBy,
          status: request.status,
          at: asDate(request.at),
        },
        create: {
          id: `${ticket.id}-${request.id}`,
          ticketId: ticket.id,
          from: request.from.toUpperCase() as Priority,
          to: request.to.toUpperCase() as Priority,
          reason: request.reason,
          requestedBy: request.requestedBy,
          status: request.status,
          at: asDate(request.at),
        },
      });
    }

    if (ticket.billing) {
      const billing = await db.billing.upsert({
        where: { ticketId: ticket.id },
        update: {
          invoiceId: ticket.billing.invoiceId,
          issuedOn: asDate(ticket.billing.issuedOn),
          dueDate: asDate(ticket.billing.dueDate),
          taxRate: ticket.billing.taxRate,
        },
        create: {
          id: `${ticket.id}-BILLING`,
          ticketId: ticket.id,
          invoiceId: ticket.billing.invoiceId,
          issuedOn: asDate(ticket.billing.issuedOn),
          dueDate: asDate(ticket.billing.dueDate),
          taxRate: ticket.billing.taxRate,
        },
      });

      for (const [index, line] of ticket.billing.lines.entries()) {
        await db.billLine.upsert({
          where: { id: `${billing.id}-LINE-${index + 1}` },
          update: { billingId: billing.id, description: line.description, qty: line.qty, unit: line.unit, rate: line.rate },
          create: { id: `${billing.id}-LINE-${index + 1}`, billingId: billing.id, description: line.description, qty: line.qty, unit: line.unit, rate: line.rate },
        });
      }
    }
  }

  console.log(`Seeded 1 admin, ${employees.length} employees, ${clients.length} customers, and ${tickets.length} tickets with related records.`);
  console.log(`Admin login: ${ADMIN_EMAIL}`);
  console.log("The admin password is the value supplied through ADMIN_INITIAL_PASSWORD.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
