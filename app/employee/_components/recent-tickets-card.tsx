import Link from "next/link";
import { Icon } from "@/components/icon";
import { currentEmployeeId } from "@/lib/data";
import { getEmployee, ticketsForEmployee } from "@/lib/tickets";
import { Card, CardHeader, StatusBadge } from "./ui";

/** "My Recent Dispatches" card from the employee sample. */
export function RecentTicketsCard({ limit = 5 }: { limit?: number }) {
  const me = getEmployee(currentEmployeeId)!;
  const recent = [...ticketsForEmployee(me.id)]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit);

  return (
    <Card>
      <CardHeader
        icon="history"
        title="My Recent Dispatches"
        right={<span className="text-[10px] font-label-mono text-on-surface-variant">{me.name}</span>}
      />
      <div className="divide-y divide-slate-border text-xs">
        {recent.map((t, i) => (
          <Link key={t.id} href={`/employee/tickets/${t.id}`} className="block p-3 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className={`font-label-mono text-xs font-bold ${i % 2 === 0 ? "text-safety-orange" : "text-slate-dark"}`}>
                #{t.id}
              </span>
              <StatusBadge status={t.status} />
            </div>
            <p className="font-medium text-on-surface line-clamp-1 text-xs">{t.title}</p>
          </Link>
        ))}
      </div>
      <div className="p-2.5 bg-slate-surface border-t border-slate-border text-center">
        <Link
          className="font-label-mono text-xs font-semibold text-slate-dark hover:text-safety-orange inline-flex items-center gap-1 transition-colors"
          href="/employee/tickets"
        >
          <span>View all tickets</span>
          <Icon name="arrow_forward" className="text-xs" />
        </Link>
      </div>
    </Card>
  );
}
