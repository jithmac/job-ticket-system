import { PrismaClient, Priority, TicketStatus, UserRole } from "@prisma/client";
import { clients, employees, tickets } from "../lib/data";
import { createPublicJobToken } from "../lib/public-links";

const db = new PrismaClient();

function asDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

async function main() {
  for (const employee of employees) {
    await db.user.upsert({
      where: { id: employee.id },
      update: { name: employee.name, email: employee.email, phone: employee.phone, title: employee.title, department: employee.department },
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
  }

  console.log(`Seeded ${employees.length} users, ${clients.length} customers, and ${tickets.length} tickets.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
