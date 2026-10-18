import { Prisma, PrismaClient } from "@prisma/client";

type TicketIdentifierDb = PrismaClient | Prisma.TransactionClient;

export async function getNextTicketIdentifiers(db: TicketIdentifierDb) {
    // Tell the next js to run a raw database query
  const [result] = await db.$queryRaw<
    Array<{ nextTicketNumber: number; nextJobNumber: number }>
  >(Prisma.sql`
    INSERT INTO "TicketNumberSequence" ("id", "nextTicketNumber", "nextJobNumber")
    VALUES (1, 2, 2)
    ON CONFLICT ("id") DO UPDATE
      SET "nextTicketNumber" = "TicketNumberSequence"."nextTicketNumber" + 1,
          "nextJobNumber" = "TicketNumberSequence"."nextJobNumber" + 1
    RETURNING "nextTicketNumber" - 1 AS "nextTicketNumber",
              "nextJobNumber" - 1 AS "nextJobNumber"
  `);

  return {
    ticketId: `TKT-${result.nextTicketNumber}`,
    jobId: `JOB-${result.nextJobNumber}`,
  };
}

export async function peekNextTicketIdentifiers(db: TicketIdentifierDb) {
  const [result] = await db.$queryRaw<
    Array<{ nextTicketNumber: number; nextJobNumber: number }>
  >(Prisma.sql`
    SELECT "nextTicketNumber", "nextJobNumber"
    FROM "TicketNumberSequence"
    WHERE "id" = 1
  `);

  if (!result) throw new Error("Ticket number sequence is not initialized.");

  return {
    ticketId: `TKT-${result.nextTicketNumber}`,
    jobId: `JOB-${result.nextJobNumber}`,
  };
}