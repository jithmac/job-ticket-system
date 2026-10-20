import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ attachmentId: string }> }) {
  const session = await requireRole([UserRole.EMPLOYEE]);
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
  if (!attachment) return new Response("Attachment not found.", { status: 404 });
  const allowed =
    attachment.ticket.ownerId === session.id ||
    attachment.ticket.createdById === session.id ||
    attachment.ticket.crew.some((member) => member.canOpen);
  if (!allowed) return new Response("You do not have access to this attachment.", { status: 403 });

  return new Response(
    `Attachment: ${attachment.name}\nType: ${attachment.label}\nSize: ${attachment.size}\n\nThis ticket currently stores attachment metadata only; the source file is not available.`,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `inline; filename="${attachment.name.replace(/["\r\n]/g, "")}.txt"`,
      },
    },
  );
}
