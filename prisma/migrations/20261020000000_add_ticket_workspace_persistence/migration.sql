ALTER TABLE "TicketCrew" ADD COLUMN "canOpen" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "TicketCrew_userId_canOpen_idx" ON "TicketCrew"("userId", "canOpen");

CREATE TABLE "HandoverNote" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HandoverNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HandoverNote_ticketId_createdAt_idx" ON "HandoverNote"("ticketId", "createdAt");

ALTER TABLE "HandoverNote" ADD CONSTRAINT "HandoverNote_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HandoverNote" ADD CONSTRAINT "HandoverNote_fromUserId_fkey"
  FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "HandoverNote" ADD CONSTRAINT "HandoverNote_toUserId_fkey"
  FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
