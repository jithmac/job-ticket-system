import { tickets } from "@/lib/data";
import { urgency } from "@/lib/tickets";
import { DeskShell } from "../_components/desk-shell";
import { careRow } from "../_components/rows";

/**
 * `(desk)` is a route group: it adds no URL segment, but lets `/customer-care` and
 * `/customer-care/tickets/[ticketId]` share this layout (search hub + ticket stream)
 * without the employees/reports pages getting it too.
 */
export default function DeskLayout({ children }: { children: React.ReactNode }) {
  const sorted = [...tickets].sort((a, b) => urgency(b) - urgency(a));
  return (
    <DeskShell rows={sorted.map(careRow)} defaultId={sorted[0].id}>
      {children}
    </DeskShell>
  );
}
