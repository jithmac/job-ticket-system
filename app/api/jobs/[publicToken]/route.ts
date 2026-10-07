import { db } from "@/lib/db";
import { publicJobUrl } from "@/lib/public-links";

export async function GET(_: Request, { params }: { params: Promise<{ publicToken: string }> }) {
  const { publicToken } = await params;
  const ticket = await db.ticket.findUnique({
    where: { publicToken },
    select: {
      jobId: true,
      title: true,
      status: true,
      customer: { select: { name: true } },
    },
  });

  if (!ticket) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  return Response.json({
    jobId: ticket.jobId,
    title: ticket.title,
    status: ticket.status,
    customer: ticket.customer.name,
    url: publicJobUrl(publicToken),
  });
}
