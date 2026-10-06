import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { currentEmployeeId } from "@/lib/data";
import { formatDate, getClient, getEmployee, ticketsForEmployee } from "@/lib/tickets";
import { Card, CardHeader, PageHeader, PriorityBadge, StatusBadge } from "../_components/ui";

export const metadata: Metadata = { title: "Previous Tickets" };

export default function HistoryPage() {
  const previous = ticketsForEmployee(currentEmployeeId)
    .filter((t) => t.status === "completed")
    .sort((a, b) => b.endDate.localeCompare(a.endDate));

  return (
    <>
      <PageHeader
        title="Previous Tickets"
        subtitle="Closed and resolved jobs you worked on."
        meta={
          <>
            RECORDS: <span className="text-slate-dark font-semibold">{previous.length}</span>
          </>
        }
      />
      <Card>
        <CardHeader icon="history" title="Resolved Ticket Archive" />
        <ol className="divide-y divide-slate-border">
          {previous.map((t) => {
            const done = t.subtasks.filter((s) => s.status === "done").length;
            return (
              <li key={t.id}>
                <Link
                  href={`/employee/tickets/${t.id}`}
                  className="p-4 md:px-5 flex flex-col md:flex-row md:items-center gap-3 hover:bg-slate-50 transition-colors"
                >
                  <span className="w-10 h-10 rounded bg-green-50 border border-green-300 flex items-center justify-center shrink-0">
                    <Icon name="task_alt" className="text-industrial-green" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-label-mono text-xs font-bold text-slate-dark">#{t.id}</span>
                      <StatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <p className="text-sm font-semibold text-on-surface line-clamp-1">{t.title}</p>
                    <p className="text-[11px] font-label-mono text-on-surface-variant">
                      {getClient(t.clientId)?.name} • Held by {getEmployee(t.ownerId)?.name} • {done}/{t.subtasks.length}{" "}
                      subtasks
                    </p>
                  </div>
                  <div className="font-label-mono text-[11px] text-on-surface-variant md:text-right shrink-0">
                    <div>
                      {formatDate(t.startDate)} → {formatDate(t.endDate)}
                    </div>
                    <div className="text-slate-dark font-semibold inline-flex items-center gap-1">
                      View ticket <Icon name="arrow_forward" className="text-xs" />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </Card>
    </>
  );
}
