// This file is a .ts file because this does not contain any JSX
"use server"; // export functions as next js server actions. 

import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag, refresh } from "next/cache";
import { Priority, TicketStatus, UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getNextTicketIdentifiers } from "@/lib/ticket-identifiers";

type TicketMutationInput = {
  mode: "create" | "edit";
  ticketId: string;
  title: string;
  clientId: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  startDate: string;
  endDate: string;
  description: string;
  participantIds: string[];
  subtasks: Array<{
    key: string;
    title: string;
    description: string;
    assigneeId: string;
    estimate: string;
  }>;
  attachments: Array<{ key: string; name: string; size: string }>;
};

type TicketMutationResult = { ok: true; ticketId: string } | { ok: false; error: string };

function asDate(value: string) {
  const result = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(result.getTime())) throw new Error("Invalid ticket date.");
  return result;
}

function attachmentKind(name: string) {
  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return { kind: "pdf", label: "PDF Document" };
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension ?? "")) return { kind: "image", label: "Image" };
  if (["xls", "xlsx", "csv"].includes(extension ?? "")) return { kind: "sheet", label: "Spreadsheet" };
  if (["log", "txt"].includes(extension ?? "")) return { kind: "log", label: "Log File" };
  return { kind: "doc", label: "Document" };
}

function validateInput(input: TicketMutationInput) {
  if (input.title.trim().length < 5) throw new Error("Enter a ticket title with at least 5 characters.");
  if (!input.clientId || !input.category) throw new Error("Select a client and category.");
  if (input.description.trim().length < 20) throw new Error("Enter a description with at least 20 characters.");
  if (!input.startDate || !input.endDate || input.endDate < input.startDate) {
    throw new Error("Choose a valid work window.");
  }
  if (input.subtasks.length === 0 || input.subtasks.some((subtask) => !subtask.title.trim())) {
    throw new Error("Add at least one subtask with a title.");
  }
  if (input.participantIds.length === 0) throw new Error("Assign at least one participating employee.");
  if (input.attachments.length === 0) throw new Error("Attach at least one supporting file.");
}

export async function saveEmployeeTicket(input: TicketMutationInput): Promise<TicketMutationResult> {
  const session = await requireRole([UserRole.EMPLOYEE]);
  try {
    validateInput(input);

    const client = await db.customer.findUnique({ where: { id: input.clientId }, select: { id: true } });
    if (!client) throw new Error("The selected client no longer exists.");

    const result = await db.$transaction(async (tx) => {
      const employees = await tx.user.findMany({
        where: { id: { in: Array.from(new Set([session.id, ...input.participantIds, ...input.subtasks.map((s) => s.assigneeId)])) }, role: UserRole.EMPLOYEE },
        select: { id: true },
      });
      const employeeIds = new Set(employees.map((employee) => employee.id));
      if (!employeeIds.has(session.id) || input.participantIds.some((id) => !employeeIds.has(id))) {
        throw new Error("One or more assigned employees are invalid.");
      }
      if (input.subtasks.some((subtask) => !employeeIds.has(subtask.assigneeId))) {
        throw new Error("One or more subtask assignees are invalid.");
      }

      const participantIds = Array.from(new Set([session.id, ...input.participantIds, ...input.subtasks.map((s) => s.assigneeId)]));
      const startDate = asDate(input.startDate);
      const endDate = asDate(input.endDate);

      if (input.mode === "edit") {
        const existing = await tx.ticket.findUnique({
          where: { id: input.ticketId },
          select: { id: true, createdById: true, ownerId: true },
        });
        if (!existing) throw new Error("Ticket not found.");
        if (existing.createdById !== session.id && existing.ownerId !== session.id) {
          throw new Error("Only the ticket creator or current holder can update this ticket.");
        }

        await tx.ticket.update({
          where: { id: input.ticketId },
          data: {
            title: input.title.trim(),
            description: input.description.trim(),
            category: input.category,
            priority: input.priority.toUpperCase() as Priority,
            startDate,
            endDate,
            customerId: input.clientId,
            crew: { deleteMany: {}, create: participantIds.map((userId) => ({ userId })) },
            subtasks: {
              deleteMany: {},
              create: input.subtasks.map((subtask) => ({
                id: `${input.ticketId}-${randomUUID()}`,
                title: subtask.title.trim(),
                description: subtask.description.trim(),
                estimate: subtask.estimate.trim() || "—",
                status: "PENDING",
                assignees: { create: [{ userId: subtask.assigneeId }] },
              })),
            },
            attachments: {
              deleteMany: {},
              create: input.attachments.map((attachment) => {
                const metadata = attachmentKind(attachment.name);
                return { id: `${input.ticketId}-${randomUUID()}`, name: attachment.name, size: attachment.size, ...metadata };
              }),
            },
          },
        });
        return input.ticketId;
      }

      const { ticketId, jobId } = await getNextTicketIdentifiers(tx);

      await tx.ticket.create({
        data: {
          id: ticketId,
          jobId,
          title: input.title.trim(),
          assetTag: "UNSPECIFIED",
          description: input.description.trim(),
          category: input.category,
          priority: input.priority.toUpperCase() as Priority,
          status: TicketStatus.OPEN,
          startDate,
          endDate,
          createdById: session.id,
          ownerId: session.id,
          customerId: input.clientId,
          crew: { create: participantIds.map((userId) => ({ userId })) },
          subtasks: {
            create: input.subtasks.map((subtask) => ({
              id: `${ticketId}-${randomUUID()}`,
              title: subtask.title.trim(),
              description: subtask.description.trim(),
              estimate: subtask.estimate.trim() || "—",
              status: "PENDING",
              assignees: { create: [{ userId: subtask.assigneeId }] },
            })),
          },
          attachments: {
            create: input.attachments.map((attachment) => {
              const metadata = attachmentKind(attachment.name);
              return { id: `${ticketId}-${randomUUID()}`, name: attachment.name, size: attachment.size, ...metadata };
            }),
          },
          activities: {
            create: {
              id: `${ticketId}-${randomUUID()}`,
              kind: "EMPLOYEE",
              authorId: session.id,
              authorName: session.name,
              authorRole: "Employee",
              text: `Ticket created and dispatched by ${session.name}.`,
              visibleToEmployees: true,
            },
          },
        },
      });
      return ticketId;
    }, { timeout: 10000 });

    revalidateTag("tickets", { expire: 0 });
    revalidatePath("/employee");
    revalidatePath("/employee/tickets");
    revalidatePath("/employee/history");
    refresh();
    return { ok: true, ticketId: result };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to save the ticket." };
  }
}
