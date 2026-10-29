"use server";

import { randomUUID } from "node:crypto";
import { UserRole } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export type AdminMutationResult = { ok: true } | { ok: false; error: string };

function message(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function setAdminTicketHold(input: { ticketId: string; hold: boolean }): Promise<AdminMutationResult> {
  try {
    const admin = await requireRole([UserRole.ADMIN]);
    await db.$transaction(async (tx) => {
      const ticket = await tx.ticket.findUnique({ where: { id: input.ticketId }, select: { id: true } });
      if (!ticket) throw new Error("Ticket not found.");
      await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: input.hold ? "ON_HOLD" : "OPEN",
          crew: { updateMany: { where: {}, data: { canOpen: !input.hold } } },
        },
      });
      await tx.activity.create({
        data: {
          id: `${ticket.id}-${randomUUID()}`,
          ticketId: ticket.id,
          kind: "ADMIN",
          authorId: admin.id,
          authorName: admin.name,
          authorRole: admin.title ?? "Administrator",
          text: input.hold ? `${admin.name} placed the ticket on hold.` : `${admin.name} removed the ticket hold.`,
          visibleToEmployees: true,
        },
      });
    });
    revalidateTag("tickets", { expire: 0 });
    revalidateTag("employee-tickets", { expire: 0 });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error, "Unable to update ticket hold status.") };
  }
}

export async function deleteAdminTicket(ticketId: string): Promise<AdminMutationResult> {
  try {
    await requireRole([UserRole.ADMIN]);
    const ticket = await db.ticket.findUnique({ where: { id: ticketId }, select: { id: true } });
    if (!ticket) throw new Error("Ticket not found.");
    await db.$transaction(async (tx) => {
      await tx.attachment.deleteMany({ where: { ticketId: ticket.id } });
      await tx.ticket.delete({ where: { id: ticket.id } });
    });
    revalidateTag("tickets", { expire: 0 });
    revalidateTag("employee-tickets", { expire: 0 });
    revalidateTag("admin-overview", { expire: 0 });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error, "Unable to delete ticket.") };
  }
}

export async function addAdminActivity(input: { ticketId: string; text: string }): Promise<AdminMutationResult> {
  try {
    const text = input.text.trim();
    if (!text) throw new Error("Enter an activity update.");
    const admin = await db.user.findUnique({ where: { id: "ADMIN-001" }, select: { id: true, name: true, title: true } });
    if (!admin) throw new Error("Administrator account not found.");
    await db.activity.create({
      data: {
        id: `${input.ticketId}-${randomUUID()}`,
        ticketId: input.ticketId,
        kind: "ADMIN",
        authorId: admin.id,
        authorName: admin.name,
        authorRole: admin.title ?? "Administrator",
        text,
        visibleToEmployees: true,
      },
    });
    revalidateTag("employee-tickets", { expire: 0 });
    revalidateTag("tickets", { expire: 0 });
    revalidateTag("admin-overview", { expire: 0 });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error, "Unable to log activity.") };
  }
}

export async function addAdminTicketEmployee(input: { ticketId: string; userId: string }): Promise<AdminMutationResult> {
  try {
    const admin = await db.user.findUnique({ where: { id: "ADMIN-001" }, select: { id: true, name: true, title: true } });
    if (!admin) throw new Error("Administrator account not found.");
    await db.$transaction(async (tx) => {
      const [ticket, employee] = await Promise.all([
        tx.ticket.findUnique({ where: { id: input.ticketId }, select: { id: true } }),
        tx.user.findUnique({ where: { id: input.userId }, select: { id: true, name: true, role: true } }),
      ]);
      if (!ticket) throw new Error("Ticket not found.");
      if (!employee || employee.role !== UserRole.EMPLOYEE) throw new Error("Select a valid employee.");
      await tx.ticketCrew.upsert({
        where: { ticketId_userId: { ticketId: ticket.id, userId: employee.id } },
        update: { canOpen: true },
        create: { ticketId: ticket.id, userId: employee.id, canOpen: true },
      });
      await tx.activity.create({
        data: {
          id: `${ticket.id}-${randomUUID()}`,
          ticketId: ticket.id,
          kind: "ADMIN",
          authorId: admin.id,
          authorName: admin.name,
          authorRole: admin.title ?? "Administrator",
          text: `${admin.name} added ${employee.name} to the ticket crew.`,
          visibleToEmployees: true,
        },
      });
    });
    revalidateTag("employee-tickets", { expire: 0 });
    revalidateTag("tickets", { expire: 0 });
    revalidateTag("admin-overview", { expire: 0 });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error, "Unable to add employee to ticket.") };
  }
}

export async function removeAdminTicketEmployee(input: { ticketId: string; userId: string }): Promise<AdminMutationResult> {
  try {
    const admin = await db.user.findUnique({ where: { id: "ADMIN-001" }, select: { id: true, name: true, title: true } });
    if (!admin) throw new Error("Administrator account not found.");
    await db.$transaction(async (tx) => {
      const [ticket, employee] = await Promise.all([
        tx.ticket.findUnique({ where: { id: input.ticketId }, select: { id: true, ownerId: true } }),
        tx.user.findUnique({ where: { id: input.userId }, select: { id: true, name: true, role: true } }),
      ]);
      if (!ticket) throw new Error("Ticket not found.");
      if (!employee || employee.role !== UserRole.EMPLOYEE) throw new Error("Employee not found.");
      if (ticket.ownerId === employee.id) throw new Error("Pass the ticket to another employee before removing its current holder.");

      await tx.subtaskAssignee.deleteMany({
        where: { userId: employee.id, subtask: { ticketId: ticket.id } },
      });
      await tx.ticketCrew.delete({
        where: { ticketId_userId: { ticketId: ticket.id, userId: employee.id } },
      });
      await tx.activity.create({
        data: {
          id: `${ticket.id}-${randomUUID()}`,
          ticketId: ticket.id,
          kind: "ADMIN",
          authorId: admin.id,
          authorName: admin.name,
          authorRole: admin.title ?? "Administrator",
          text: `${admin.name} removed ${employee.name} from the ticket crew.`,
          visibleToEmployees: true,
        },
      });
    });
    revalidateTag("employee-tickets", { expire: 0 });
    revalidateTag("tickets", { expire: 0 });
    revalidateTag("admin-overview", { expire: 0 });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error, "Unable to remove employee from ticket.") };
  }
}

export async function passAdminTicket(input: { ticketId: string; toUserId: string; note: string }): Promise<AdminMutationResult> {
  try {
    const admin = await db.user.findUnique({ where: { id: "ADMIN-001" }, select: { id: true, name: true } });
    if (!admin) throw new Error("Administrator account not found.");
    await db.$transaction(async (tx) => {
      const [ticket, recipient] = await Promise.all([
        tx.ticket.findUnique({ where: { id: input.ticketId }, select: { id: true, ownerId: true } }),
        tx.ticketCrew.findUnique({
          where: { ticketId_userId: { ticketId: input.ticketId, userId: input.toUserId } },
          select: { user: { select: { id: true, name: true, role: true } } },
        }),
      ]);
      if (!ticket) throw new Error("Ticket not found.");
      if (!recipient || recipient.user.role !== UserRole.EMPLOYEE) throw new Error("Select an employee assigned to this ticket.");
      if (ticket.ownerId === recipient.user.id) throw new Error("That employee already holds the ticket.");

      await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          ownerId: recipient.user.id,
          crew: {
            upsert: {
              where: { ticketId_userId: { ticketId: ticket.id, userId: recipient.user.id } },
              update: { canOpen: true },
              create: { userId: recipient.user.id, canOpen: true },
            },
          },
        },
      });
      await tx.handoverNote.create({
        data: {
          id: `${ticket.id}-${randomUUID()}`,
          ticketId: ticket.id,
          fromUserId: admin.id,
          toUserId: recipient.user.id,
          note: input.note.trim() || null,
        },
      });
      await tx.activity.create({
        data: {
          id: `${ticket.id}-${randomUUID()}`,
          ticketId: ticket.id,
          kind: "ADMIN",
          authorId: admin.id,
          authorName: admin.name,
          authorRole: "Administrator",
          text: `Ticket passed to ${recipient.user.name}.${input.note.trim() ? ` Handover note: ${input.note.trim()}` : ""}`,
          visibleToEmployees: true,
        },
      });
    });
    revalidateTag("employee-tickets", { expire: 0 });
    revalidateTag("admin-overview", { expire: 0 });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error, "Unable to pass ticket.") };
  }
}

export async function assignAdminSubtask(input: {
  ticketId: string;
  subtaskId: string;
  userId: string;
}): Promise<AdminMutationResult> {
  try {
    const admin = await db.user.findUnique({ where: { id: "ADMIN-001" }, select: { id: true, name: true, title: true } });
    if (!admin) throw new Error("Administrator account not found.");
    await db.$transaction(async (tx) => {
      const subtask = await tx.subtask.findFirst({
        where: { id: input.subtaskId, ticketId: input.ticketId },
        select: { id: true, title: true },
      });
      if (!subtask) throw new Error("Subtask not found.");
      const employee = input.userId
        ? await tx.ticketCrew.findUnique({
            where: { ticketId_userId: { ticketId: input.ticketId, userId: input.userId } },
            select: { userId: true, user: { select: { name: true, role: true } } },
          })
        : null;
      if (input.userId && (!employee || employee.user.role !== UserRole.EMPLOYEE)) {
        throw new Error("Select an employee assigned to this ticket.");
      }
      await tx.subtaskAssignee.deleteMany({ where: { subtaskId: subtask.id } });
      if (employee) await tx.subtaskAssignee.create({ data: { subtaskId: subtask.id, userId: employee.userId } });
      await tx.activity.create({
        data: {
          id: `${input.ticketId}-${randomUUID()}`,
          ticketId: input.ticketId,
          kind: "ADMIN",
          authorId: admin.id,
          authorName: admin.name,
          authorRole: admin.title ?? "Administrator",
          text: employee
            ? `${admin.name} assigned ${employee.user.name} to subtask "${subtask.title}".`
            : `${admin.name} removed the assignment from subtask "${subtask.title}".`,
          visibleToEmployees: true,
        },
      });
    });
    revalidateTag("employee-tickets", { expire: 0 });
    revalidateTag("tickets", { expire: 0 });
    revalidateTag("admin-overview", { expire: 0 });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: message(error, "Unable to assign subtask.") };
  }
}
