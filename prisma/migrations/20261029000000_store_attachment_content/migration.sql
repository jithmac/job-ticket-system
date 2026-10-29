ALTER TABLE "Attachment"
ADD COLUMN "mimeType" TEXT NOT NULL DEFAULT 'application/octet-stream',
ADD COLUMN "content" BYTEA;
