import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ attachmentId: string }> }) {
  const session = await requireRole([UserRole.EMPLOYEE, UserRole.ADMIN]);
  const { attachmentId } = await params;
  const attachment = await db.attachment.findUnique({
    where: { id: attachmentId },
    select: {
      id: true,
      name: true,
      size: true,
      kind: true,
      label: true,
      ticket: {
        select: {
          ownerId: true,
          createdById: true,
          crew: { where: { userId: session.id }, select: { canOpen: true } },
        },
      },
    },
  });
  if (!attachment || !attachment.ticket) return new Response("Attachment not found.", { status: 404 });
  const allowed =
    session.role === UserRole.ADMIN ||
    attachment.ticket.ownerId === session.id ||
    attachment.ticket.createdById === session.id ||
    attachment.ticket.crew.some((member) => member.canOpen);
  if (!allowed) return new Response("You do not have access to this attachment.", { status: 403 });
  const file = await db.attachment.findUnique({
    where: { id: attachmentId },
    select: { name: true, mimeType: true, content: true },
  });
  if (!file?.content) return new Response("This attachment has no stored file content.", { status: 404 });

  return new Response(new Uint8Array(file.content), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename="${file.name.replace(/["\r\n]/g, "")}"`,
    },
  });
}
