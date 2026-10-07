import { getTickets } from "@/lib/db-data";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { urgency } from "@/lib/tickets";
import { DeskShell } from "../_components/desk-shell";
import { careRow } from "../_components/rows";

/**
 * `(desk)` is a route group: it adds no URL segment, but lets `/customer-care` and
 * `/customer-care/tickets/[ticketId]` share this layout (search hub + ticket stream)
 * without the employees/reports pages getting it too.
 */
export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  await requireRole([UserRole.CARE]);
  const tickets = await getTickets();
  const sorted = [...tickets].sort((a, b) => urgency(b) - urgency(a));
  const rows = await Promise.all(sorted.map(careRow));
  return (
    <DeskShell rows={rows} defaultId={sorted[0].id}>
      {children}
    </DeskShell>
  );
}
