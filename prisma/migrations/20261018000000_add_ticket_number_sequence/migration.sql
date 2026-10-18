CREATE TABLE "TicketNumberSequence" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nextTicketNumber" INTEGER NOT NULL,
    "nextJobNumber" INTEGER NOT NULL,

    CONSTRAINT "TicketNumberSequence_pkey" PRIMARY KEY ("id")
);

INSERT INTO "TicketNumberSequence" ("id", "nextTicketNumber", "nextJobNumber")
SELECT
    1,
    COALESCE(MAX(CASE WHEN "id" ~ '^TKT-[0-9]+$' THEN CAST(SUBSTRING("id" FROM 5) AS INTEGER) ELSE 0 END), 0) + 1,
    COALESCE(MAX(CASE WHEN "jobId" ~ '^JOB-[0-9]+$' THEN CAST(SUBSTRING("jobId" FROM 5) AS INTEGER) ELSE 0 END), 0) + 1
FROM "Ticket";