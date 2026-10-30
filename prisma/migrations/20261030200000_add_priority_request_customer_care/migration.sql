ALTER TABLE "PriorityRequest" ADD COLUMN "customerCareId" TEXT;

CREATE INDEX "PriorityRequest_ticketId_status_idx" ON "PriorityRequest"("ticketId", "status");

CREATE INDEX "PriorityRequest_customerCareId_idx" ON "PriorityRequest"("customerCareId");

ALTER TABLE "PriorityRequest"
ADD CONSTRAINT "PriorityRequest_customerCareId_fkey"
FOREIGN KEY ("customerCareId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
