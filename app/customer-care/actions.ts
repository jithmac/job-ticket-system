"use server";

import { randomUUID } from "node:crypto";
import { UserRole } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ActivityEntry } from "@/lib/types";
import type { Priority, PriorityRequest } from "@/lib/types";

export type CareMutationResult =
  | { ok: true; entry: ActivityEntry }
  | { ok: false; error: string };

export type PriorityRequestMutationResult =
  | { ok: true; request: PriorityRequest }
  | { ok: false; error: string };

function message(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function addCareActivity(input: {
  ticketId: string;
  text: string;
}): Promise<CareMutationResult> {
  try {
    const careAgent = await requireRole([UserRole.CARE]);
    const text = input.text.trim();
    if (!text) throw new Error("Enter a note before saving.");

    const ticket = await db.ticket.findUnique({ where: { id: input.ticketId }, select: { id: true } });
    if (!ticket) throw new Error("Ticket not found.");

    const at = new Date();
    const entry = {
      id: `${ticket.id}-${randomUUID()}`,
      ticketId: ticket.id,
      kind: "CUSTOMER_CARE" as const,
      authorId: careAgent.id,
      authorName: careAgent.name,
      authorRole: careAgent.title ?? "Customer Care",
      text,
      visibleToEmployees: true,
      at,
    };
    await db.activity.create({ data: entry });

    revalidateTag("tickets", { expire: 0 });
    revalidateTag("employee-tickets", { expire: 0 });
    revalidateTag("admin-overview", { expire: 0 });
    return {
      ok: true,
      entry: {
        id: entry.id,
        kind: "customer-care",
        authorId: entry.authorId,
        authorName: entry.authorName,
        authorRole: entry.authorRole,
        at: entry.at.toISOString(),
        text: entry.text,
        visibleToEmployees: true,
      },
    };
  } catch (error) {
    return { ok: false, error: message(error, "Unable to save the note.") };
  }
}

export async function addPriorityRequest(input: {
    ticketId: string;
    from: Priority;
    to: Priority;
    reason: string;
  }): Promise<PriorityRequestMutationResult> {
    try {
      const careAgent = await requireRole([UserRole.CARE]);
      const reason = input.reason.trim();
      if (!reason || reason.length < 10) throw new Error("Provide a reason with at least 10 characters.");
      if (input.from === input.to) throw new Error("Choose a different priority level.");

      const ticket = await db.ticket.findUnique({ where: { id: input.ticketId }, select: { id: true, priority: true } });
      if (!ticket) throw new Error("Ticket not found.");
      if (ticket.priority.toLowerCase() !== input.from) throw new Error("This ticket priority has changed. Refresh and try again.");

      const existing = await db.priorityRequest.findFirst({ where: { ticketId: ticket.id, status: "pending" }, select: { id: true } });
      if (existing) throw new Error("A priority request is already awaiting admin approval.");

      const request = await db.priorityRequest.create({
        data: {
          id: `${ticket.id}-${randomUUID()}`,
          ticketId: ticket.id,
          customerCareId: careAgent.id,
          from: input.from.toUpperCase() as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
          to: input.to.toUpperCase() as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
          reason,
          requestedBy: `${careAgent.name} (${careAgent.id})`,
          status: "pending",
        },
      });

      revalidateTag("tickets", { expire: 0 });
      revalidateTag("admin-overview", { expire: 0 });
      return {
        ok: true,
        request: {
          id: request.id,
          from: input.from,
          to: input.to,
          reason: request.reason,
          customerCareId: careAgent.id,
          requestedBy: request.requestedBy,
          at: request.at.toISOString(),
          status: "pending",
        },
      };
    } catch (error) {
      return { ok: false, error: message(error, "Unable to submit priority request.") };
  }
}
