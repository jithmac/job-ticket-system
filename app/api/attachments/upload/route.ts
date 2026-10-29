import { randomUUID } from "node:crypto";
import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

function attachmentKind(name: string) {
  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return { kind: "pdf", label: "PDF Document" };
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension ?? "")) return { kind: "image", label: "Image" };
  if (["xls", "xlsx", "csv"].includes(extension ?? "")) return { kind: "sheet", label: "Spreadsheet" };
  if (["log", "txt"].includes(extension ?? "")) return { kind: "log", label: "Log File" };
  return { kind: "doc", label: "Document" };
}

export async function POST(request: Request) {
  const session = await requireRole([UserRole.EMPLOYEE]);
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return Response.json({ error: "A file is required." }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return Response.json({ error: "Each attachment must be 25 MB or smaller." }, { status: 413 });

  const attachment = await db.attachment.create({
    data: {
      id: randomUUID(),
      uploadedById: session.id,
      name: file.name,
      size: String(file.size),
      mimeType: file.type || "application/octet-stream",
      content: Buffer.from(await file.arrayBuffer()),
      ...attachmentKind(file.name),
    },
    select: { id: true, name: true, size: true, mimeType: true },
  });
  return Response.json(attachment);
}
