// This file is a .ts file because this does not contain any JSX
"use server";

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
  subtasks: Array<{ key: string; title: string; description: string; assigneeId: string; estimate: string }>;
  attachments: Array<{ key: string; name: string; size: string }>;
};

type TicketMutationResult = { ok: true; ticketId: string } | { ok: false; error: string };
type WorkspaceSubtaskInput = {
  id: string;
  title: string;
  description: string;
  assigneeIds: string[];
  estimate: string;
  status: "pending" | "in_progress" | "done";
  progress: number;
  completedAt?: string;
};
type WorkspaceActivityInput = {
  id: string;
  kind: "system" | "employee" | "customer-care" | "admin";
  authorId?: string;
  authorName: string;
  authorRole: string;
  at: string;
  text: string;
  visibleToEmployees: boolean;
};
type WorkspaceInput = { ticketId: string; subtasks: WorkspaceSubtaskInput[]; activities: WorkspaceActivityInput[] };

function mutationError(error: unknown, fallback: string) {
  if (error instanceof Error && /Can't reach database server|P1001|P2024/i.test(error.message)) {
    return "The database is temporarily unavailable. Please try again in a moment.";
  }
  return error instanceof Error ? error.message : fallback;
}

function asDate(value: string) {
  const result = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(result.getTime())) throw new Error("Invalid ticket date.");
  return result;
}

function workspaceDate(value: string | undefined) {
  if (!value) return null;
  const result = new Date(value);
  if (Number.isNaN(result.getTime())) throw new Error("Invalid workspace date.");
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
  if (!input.startDate || !input.endDate || input.endDate < input.startDate) throw new Error("Choose a valid work window.");
  if (input.subtasks.length === 0 || input.subtasks.some((subtask) => !subtask.title.trim())) throw new Error("Add at least one subtask with a title.");
  if (input.participantIds.length === 0) throw new Error("Assign at least one participating employee.");
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
      if (!employeeIds.has(session.id) || input.participantIds.some((id) => !employeeIds.has(id)) || input.subtasks.some((subtask) => !employeeIds.has(subtask.assigneeId))) {
        throw new Error("One or more assigned employees are invalid.");
      }
      const participantIds = Array.from(new Set([session.id, ...input.participantIds, ...input.subtasks.map((s) => s.assigneeId)]));
      const startDate = asDate(input.startDate);
      const endDate = asDate(input.endDate);
      if (input.mode === "edit") {
        const existing = await tx.ticket.findUnique({ where: { id: input.ticketId }, select: { id: true, createdById: true, ownerId: true } });
        if (!existing) throw new Error("Ticket not found.");
        if (existing.createdById !== session.id && existing.ownerId !== session.id) throw new Error("Only the ticket creator or current holder can update this ticket.");
        await tx.ticket.update({
          where: { id: input.ticketId },
          data: {
            title: input.title.trim(), description: input.description.trim(), category: input.category,
            priority: input.priority.toUpperCase() as Priority, startDate, endDate, customerId: input.clientId,
            crew: { deleteMany: {}, create: participantIds.map((userId) => ({ userId, canOpen: userId === session.id })) },
            subtasks: { deleteMany: {}, create: input.subtasks.map((subtask) => ({
              id: `${input.ticketId}-${randomUUID()}`, title: subtask.title.trim(), description: subtask.description.trim(),
              estimate: subtask.estimate.trim() || "—", status: "PENDING", assignees: { create: [{ userId: subtask.assigneeId }] },
            })) },
            attachments: { deleteMany: {}, create: input.attachments.map((attachment) => ({
              id: `${input.ticketId}-${randomUUID()}`, name: attachment.name, size: attachment.size, ...attachmentKind(attachment.name),
            })) },
          },
        });
        await tx.activity.create({
          data: {
            id: `${input.ticketId}-${randomUUID()}`,
            ticketId: input.ticketId,
            kind: "EMPLOYEE",
            authorId: session.id,
            authorName: session.name,
            authorRole: "Employee",
            text: `Ticket details updated by ${session.name}.`,
            visibleToEmployees: true,
          },
        });
        return input.ticketId;
      }
      const { ticketId, jobId } = await getNextTicketIdentifiers(tx);
      await tx.ticket.create({
        data: {
          id: ticketId, jobId, title: input.title.trim(), assetTag: "UNSPECIFIED", description: input.description.trim(),
          category: input.category, priority: input.priority.toUpperCase() as Priority, status: TicketStatus.OPEN, startDate, endDate,
          createdById: session.id, ownerId: session.id, customerId: input.clientId,
          crew: { create: participantIds.map((userId) => ({ userId, canOpen: userId === session.id })) },
          subtasks: { create: input.subtasks.map((subtask) => ({
            id: `${ticketId}-${randomUUID()}`, title: subtask.title.trim(), description: subtask.description.trim(),
            estimate: subtask.estimate.trim() || "—", status: "PENDING", assignees: { create: [{ userId: subtask.assigneeId }] },
          })) },
          attachments: { create: input.attachments.map((attachment) => ({
            id: `${ticketId}-${randomUUID()}`, name: attachment.name, size: attachment.size, ...attachmentKind(attachment.name),
          })) },
          activities: { create: { id: `${ticketId}-${randomUUID()}`, kind: "EMPLOYEE", authorId: session.id, authorName: session.name, authorRole: "Employee", text: `Ticket created and dispatched by ${session.name}.`, visibleToEmployees: true } },
        },
      });
      return ticketId;
    }, { timeout: 10000 });
    revalidateTag("tickets", { expire: 0 });
    revalidatePath("/employee"); revalidatePath("/employee/tickets"); revalidatePath("/employee/history"); refresh();
    return { ok: true, ticketId: result };
  } catch (error) {
    return { ok: false, error: mutationError(error, "Unable to save the ticket.") };
  }
}

export async function saveEmployeeTicketWorkspace(input: WorkspaceInput): Promise<TicketMutationResult> {
  try {
    const session = await requireRole([UserRole.EMPLOYEE]);
    const result = await db.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: input.ticketId },
        select: {
          id: true,
          createdById: true,
          ownerId: true,
          crew: { select: { userId: true, canOpen: true } },
          subtasks: { select: { id: true } },
        },
      });

      if (!ticket) throw new Error("Ticket not found.");

      const membership = ticket.crew.find((member) => member.userId === session.id);

      if (ticket.createdById !== session.id && ticket.ownerId !== session.id && !membership?.canOpen) throw new Error("You do not have access to update this ticket.");
      const assigneeIds = Array.from(new Set(input.subtasks.flatMap((subtask) => subtask.assigneeIds)));
      const employees = await tx.user.findMany({ where: { id: { in: [session.id, ...assigneeIds] }, role: UserRole.EMPLOYEE }, select: { id: true } });
      if (employees.length !== new Set([session.id, ...assigneeIds]).size) throw new Error("One or more subtask assignees are invalid.");
      const existingSubtaskIds = new Set(ticket.subtasks.map((subtask) => subtask.id));
      const submittedSubtaskIds = new Set(input.subtasks.map((subtask) => subtask.id));
      if (submittedSubtaskIds.size !== input.subtasks.length) throw new Error("Duplicate subtask IDs were submitted.");

      await tx.subtaskAssignee.deleteMany({
        where: { subtaskId: { in: input.subtasks.map((subtask) => subtask.id) } },
      });
      const assigneesToCreate = [];
      for (const subtask of input.subtasks) {
        const fields = {
          title: subtask.title.trim(), description: subtask.description.trim(), estimate: subtask.estimate.trim() || "—",
          status: subtask.status.toUpperCase() as "PENDING" | "IN_PROGRESS" | "DONE",
          progress: Math.max(0, Math.min(100, subtask.progress)), completedAt: workspaceDate(subtask.completedAt),
        };
        if (existingSubtaskIds.has(subtask.id)) {
          await tx.subtask.update({ where: { id: subtask.id }, data: fields });
        } else {
          await tx.subtask.create({ data: { id: subtask.id, ticketId: input.ticketId, ...fields } });
        }
        assigneesToCreate.push(...subtask.assigneeIds.map((userId) => ({ subtaskId: subtask.id, userId })));
      }
      if (assigneesToCreate.length > 0) {
        await tx.subtaskAssignee.createMany({ data: assigneesToCreate, skipDuplicates: true });
      }
      await tx.activity.createMany({
        data: input.activities.map((activity) => ({
          id: activity.id, ticketId: input.ticketId,
          kind: activity.kind.toUpperCase().replace("-", "_") as "SYSTEM" | "EMPLOYEE" | "CUSTOMER_CARE" | "ADMIN",
          authorId: activity.authorId ?? null, authorName: activity.authorName, authorRole: activity.authorRole,
          text: activity.text, visibleToEmployees: activity.visibleToEmployees, at: workspaceDate(activity.at) ?? new Date(),
        })),
        skipDuplicates: true,
      });
      return input.ticketId;
    }, { timeout: 30000 });

    revalidateTag("employee-tickets", { expire: 0 });
    return { ok: true, ticketId: result };
  } catch (error) {
    return { ok: false, error: mutationError(error, "Unable to save ticket workspace changes.") };
  }
}

export async function addEmployeeTicketSubtasks(
  input: Pick<WorkspaceInput, "ticketId" | "subtasks" | "activities">,
): Promise<TicketMutationResult> {
  try {
    const session = await requireRole([UserRole.EMPLOYEE]);
    const result = await db.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({
        where: { id: input.ticketId },
        select: { id: true, createdById: true, ownerId: true },
      });
      if (!ticket) throw new Error("Ticket not found.");
      if (ticket.createdById !== session.id && ticket.ownerId !== session.id) {
        throw new Error("You do not have access to update this ticket.");
      }

      for (const subtask of input.subtasks) {
        await tx.subtask.create({
          data: {
            id: subtask.id,
            ticketId: input.ticketId,
            title: subtask.title.trim(),
            description: subtask.description.trim(),
            estimate: subtask.estimate.trim() || "—",
            status: subtask.status.toUpperCase() as "PENDING" | "IN_PROGRESS" | "DONE",
            progress: Math.max(0, Math.min(100, subtask.progress)),
            completedAt: workspaceDate(subtask.completedAt),
            assignees: {
              create: subtask.assigneeIds.map((userId) => ({ userId })),
            },
          },
        });
      }

      await tx.activity.createMany({
        data: input.activities.map((activity) => ({
          id: activity.id,
          ticketId: input.ticketId,
          kind: activity.kind.toUpperCase().replace("-", "_") as "SYSTEM" | "EMPLOYEE" | "CUSTOMER_CARE" | "ADMIN",
          authorId: activity.authorId ?? null,
          authorName: activity.authorName,
          authorRole: activity.authorRole,
          text: activity.text,
          visibleToEmployees: activity.visibleToEmployees,
          at: workspaceDate(activity.at) ?? new Date(),
        })),
        skipDuplicates: true,
      });
      return input.ticketId;
    }, { timeout: 30000 });
    revalidateTag("employee-tickets", { expire: 0 });
    return { ok: true, ticketId: result };
  } catch (error) {
    return { ok: false, error: mutationError(error, "Unable to add ticket subtasks.") };
  }
}

export async function passEmployeeTicket(input: { ticketId: string; toUserId: string; note: string }): Promise<TicketMutationResult> {
  try {
    const session = await requireRole([UserRole.EMPLOYEE]);
    const result = await db.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({ where: { id: input.ticketId }, select: { id: true, ownerId: true } });
      if (!ticket || ticket.ownerId !== session.id) throw new Error("Only the current ticket holder can pass this ticket.");
      const recipient = await tx.user.findUnique({ where: { id: input.toUserId }, select: { id: true, name: true, role: true } });
      if (!recipient || recipient.role !== UserRole.EMPLOYEE) throw new Error("Select a valid employee.");
      await tx.ticket.update({
        where: { id: input.ticketId },
        data: { ownerId: input.toUserId, crew: { upsert: {
          where: { ticketId_userId: { ticketId: input.ticketId, userId: input.toUserId } },
          update: { canOpen: true }, create: { userId: input.toUserId, canOpen: true },
        } } },
      });
      await tx.handoverNote.create({ data: {
        id: `${input.ticketId}-${randomUUID()}`, ticketId: input.ticketId, fromUserId: session.id, toUserId: input.toUserId, note: input.note.trim() || null,
      } });
      await tx.activity.create({ data: {
        id: `${input.ticketId}-${randomUUID()}`, ticketId: input.ticketId, kind: "EMPLOYEE", authorId: session.id,
        authorName: session.name, authorRole: "Employee", text: `Ticket passed from ${session.name} to ${recipient.name}.${input.note.trim() ? ` Handover note: ${input.note.trim()}` : ""}`, visibleToEmployees: true,
      } });
      return input.ticketId;
    }, { timeout: 10000 });
    revalidateTag("employee-tickets", { expire: 0 });
    return { ok: true, ticketId: result };
  } catch (error) {
    return { ok: false, error: mutationError(error, "Unable to pass ticket.") };
  }
}
