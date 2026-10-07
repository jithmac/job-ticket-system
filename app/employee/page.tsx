import type { Metadata } from "next";
import Link from "next/link"; // use to navigate
import { Icon } from "@/components/icon";
import { getClients, getEmployee } from "@/lib/db-data";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import {
  daysRemaining,
  formatDate,
  formatDateTime,
  remainingLabel,
  ticketProgress,
  ticketsForEmployee,
  urgency,
} from "@/lib/tickets";
import { RecentTicketsCard } from "./_components/recent-tickets-card";
import { Card, CardHeader, PageHeader, PriorityBadge, ProgressBar, SlaPolicyBanner, StatusBadge } from "./_components/ui";

export const metadata: Metadata = { title: "Overview" };

export default async function EmployeeOverviewPage() {
  const session = await requireRole([UserRole.EMPLOYEE]);
  const me = (await getEmployee(session.id))!;
  const mine = await ticketsForEmployee(me.id);
  const clients = await getClients();
  const clientsById = new Map(clients.map((client) => [client.id, client]));
  const active = mine.filter((t) => t.status !== "completed").sort((a, b) => urgency(b) - urgency(a));
  const mySubtasks = active.flatMap((t) =>
    t.subtasks.filter((s) => s.status !== "done" && s.assigneeIds.includes(me.id)).map((s) => ({ ticket: t, subtask: s })),
  );
  const careNotes = mine
    .flatMap((t) => t.activity.filter((a) => a.kind === "customer-care" && a.visibleToEmployees).map((a) => ({ ticket: t, note: a })))
    .sort((a, b) => b.note.at.localeCompare(a.note.at));

  const stats = [
    { label: "Active Tickets", value: active.length, icon: "confirmation_number", tone: "text-safety-orange" },
    { label: "Holding", value: active.filter((t) => t.ownerId === me.id).length, icon: "back_hand", tone: "text-slate-dark" },
    { label: "My Open Subtasks", value: mySubtasks.length, icon: "checklist", tone: "text-machinery-amber" },
    {
      label: "Due In 7 Days",
      value: active.filter((t) => daysRemaining(t) <= 7).length,
      icon: "event_upcoming",
      tone: "text-error",
    },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${me.name.split(" ")[0]}`}
        subtitle="Here is everything on your plate today."
        meta={
          <Link
            href="/employee/tickets/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 btn-safety rounded font-label-mono text-xs uppercase tracking-wider font-semibold text-white shadow hover:shadow-md transition-all"
          >
            <Icon name="add_box" className="text-base" /> Create New Ticket
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface-container-lowest border border-slate-border rounded-lg shadow-sm p-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded bg-slate-surface border border-slate-border flex items-center justify-center">
              <Icon name={s.icon} className={`${s.tone} text-[22px]`} />
            </span>
            <div>
              <div className="font-headline-md font-bold text-2xl text-on-background leading-none">{s.value}</div>
              <div className="font-label-mono text-[10px] uppercase tracking-wider text-on-surface-variant mt-1">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card>
            <CardHeader
              icon="engineering"
              title="Active Tickets"
              right={
                <Link href="/employee/tickets" className="text-[10px] font-label-mono font-semibold text-slate-dark hover:text-safety-orange">
                  VIEW ALL →
                </Link>
              }
            />
            <div className="divide-y divide-slate-border">
              {active.map((t) => {
                const progress = ticketProgress(t);
                return (
                  <Link key={t.id} href={`/employee/tickets/${t.id}`} className="block p-4 md:px-5 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-label-mono text-xs font-bold text-safety-orange">#{t.id}</span>
                        <PriorityBadge priority={t.priority} />
                        {t.ownerId === me.id && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-label-mono font-bold bg-slate-dark text-white uppercase">
                            Holder
                          </span>
                        )}
                      </div>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="text-sm font-semibold text-on-surface line-clamp-1">{t.title}</p>
                    <p className="text-[11px] font-label-mono text-on-surface-variant mb-2.5">
                      {clientsById.get(t.clientId)?.name} • Ends {formatDate(t.endDate)} • {remainingLabel(t)}
                    </p>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={progress} />
                      <span className="font-label-mono text-[10px] font-bold text-slate-dark w-8 text-right">{progress}%</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader
              icon="checklist"
              title="My Open Subtasks"
              right={<span className="text-[10px] font-label-mono text-on-surface-variant">{mySubtasks.length} Open</span>}
            />
            <ul className="divide-y divide-slate-border">
              {mySubtasks.map(({ ticket, subtask }) => (
                <li key={`${ticket.id}-${subtask.id}`}>
                  <Link href={`/employee/tickets/${ticket.id}`} className="p-3.5 md:px-5 flex items-center gap-3 hover:bg-slate-50">
                    <Icon
                      name={subtask.status === "in_progress" ? "pending" : "radio_button_unchecked"}
                      className={subtask.status === "in_progress" ? "text-safety-orange" : "text-outline"}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-on-surface line-clamp-1">{subtask.title}</p>
                      <p className="text-[10px] font-label-mono text-on-surface-variant">
                        #{ticket.id} • Est: {subtask.estimate}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-label-mono font-semibold border ${
                        subtask.status === "in_progress"
                          ? "bg-amber-50 text-machinery-amber border-amber-300"
                          : "bg-slate-100 text-on-surface-variant border-slate-border"
                      }`}
                    >
                      {subtask.status === "in_progress" ? `${subtask.progress}%` : "Queued"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <aside className="lg:col-span-4 flex flex-col gap-5">
          <Card>
            <CardHeader icon="support_agent" title="Notes From Customer Care" />
            <div className="divide-y divide-slate-border">
              {careNotes.length === 0 && <p className="p-3 text-xs text-on-surface-variant">No notes yet.</p>}
              {careNotes.map(({ ticket, note }) => (
                <Link key={`${ticket.id}-${note.id}`} href={`/employee/tickets/${ticket.id}`} className="block p-3 hover:bg-slate-50 border-l-4 border-l-safety-orange">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-label-mono text-[11px] font-bold text-safety-orange">#{ticket.id}</span>
                    <span className="text-[10px] font-label-mono text-on-surface-variant">{formatDateTime(note.at)}</span>
                  </div>
                  <p className="text-xs text-on-surface line-clamp-3">{note.text}</p>
                  <p className="text-[10px] font-label-mono text-on-surface-variant mt-1">— {note.authorName}</p>
                </Link>
              ))}
            </div>
          </Card>
          <RecentTicketsCard limit={4} />
          <SlaPolicyBanner />
        </aside>
      </div>
    </>
  );
}
