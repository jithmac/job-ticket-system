ALTER TABLE "Attachment"
DROP CONSTRAINT "Attachment_ticketId_fkey";

ALTER TABLE "Attachment"
ALTER COLUMN "ticketId" DROP NOT NULL,
ADD COLUMN "uploadedById" TEXT;

ALTER TABLE "Attachment"
ADD CONSTRAINT "Attachment_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
