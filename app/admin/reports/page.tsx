import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { getClients, getEmployees, getTickets } from "@/lib/db-data";
import {
  activeSubtaskIndex,
  formatDate,
  getClient,
  isOverdue,
  phaseLabel,
  priorityLabel,
  REFERENCE_DATE,
  priorityOrder,
  statusLabel,
  ticketProgress,
} from "@/lib/tickets";
import type { Ticket, TicketStatus } from "@/lib/types";
import { PageTitle, PanelTitle, ProgressTrack, StatCard } from "../_components/ui";

export const metadata: Metadata = { title: "Progress Reports" };

/** Share of the scheduled window that has elapsed (0-100). */
function expectedProgress(t: Ticket) {
  const start = new Date(`${t.startDate}T00:00:00`).getTime();
  const end = new Date(`${t.endDate}T23:59:59`).getTime();
  const now = new Date(REFERENCE_DATE).getTime();
  return Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)));
}

function health(t: Ticket) {
  if (t.status === "completed") return { label: "Delivered", cls: "bg-slate-100 text-slate-600 border-slate-300" };
  if (isOverdue(t)) return { label: "Overdue", cls: "bg-red-50 text-error border-red-200" };
  if (ticketProgress(t) + 15 < expectedProgress(t)) return { label: "At Risk", cls: "bg-amber-100 text-amber-900 border-amber-300" };
  return { label: "On Track", cls: "bg-emerald-50 text-emerald-800 border-emerald-300" };
}

export default async function AdminReportsPage() {
  const [clients, employees, tickets] = await Promise.all([getClients(), getEmployees(), getTickets()]);
  const clientsById = new Map(clients.map((client) => [client.id, client]));
  const active = tickets.filter((t) => t.status !== "completed");
  const avgProgress = Math.round(active.reduce((s, t) => s + ticketProgress(t), 0) / Math.max(active.length, 1));
  const overdue = active.filter(isOverdue).length;
  const atRisk = active.filter((t) => health(t).label === "At Risk").length;
  const subtasks = tickets.flatMap((t) => t.subtasks);
  const subtasksDone = subtasks.filter((s) => s.status === "done").length;

  const statuses: TicketStatus[] = ["open", "in_progress", "awaiting_signoff", "on_hold", "completed"];
  const workload = employees
    .map((e) => {
      const assigned = active.filter((t) => t.ownerId === e.id || t.participantIds.includes(e.id));
      const tasks = active.flatMap((t) => t.subtasks.filter((s) => s.assigneeIds.includes(e.id)));
      return { e, tickets: assigned.length, open: tasks.filter((s) => s.status !== "done").length, done: tasks.filter((s) => s.status === "done").length };
    })
    .sort((a, b) => b.tickets - a.tickets);
  const maxLoad = Math.max(...workload.map((w) => w.tickets), 1);

  return (
    <>
      <PageTitle
        badges={
          <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded text-xs font-label-mono font-semibold border border-slate-300">
            AS OF {formatDate(REFERENCE_DATE)}
          </span>
        }
        title="Progress Reports"
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Active Jobs" value={active.length} icon="engineering" sub={`${tickets.length - active.length} delivered`} />
        <StatCard label="Avg Progress" value={`${avgProgress}%`} icon="donut_large" sub="across active jobs" />
        <StatCard label="Subtasks Done" value={`${subtasksDone}/${subtasks.length}`} icon="checklist" tone="text-industrial-green" />
        <StatCard label="At Risk" value={atRisk} icon="report" tone="text-machinery-amber" sub="behind schedule" />
        <StatCard label="Overdue" value={overdue} icon="alarm" tone="text-error" sub="past end date" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <section className="bg-white border border-slate-200 rounded p-6 flex flex-col gap-4 shadow-sm">
            <PanelTitle
              icon="timeline"
              title="Job Progress vs. Schedule"
              right={<span className="text-xs font-label-mono text-slate-400">ACTUAL ▮ EXPECTED ┃</span>}
            />
            <div className="flex flex-col divide-y divide-slate-100">
              {[...tickets]
                .sort((a, b) => a.endDate.localeCompare(b.endDate))
                .map((t) => {
                  const p = ticketProgress(t);
                  const exp = t.status === "completed" ? 100 : expectedProgress(t);
                  const h = health(t);
                  const idx = activeSubtaskIndex(t);
                  return (
                    <Link key={t.id} href={`/admin/tickets/${t.id}`} className="py-3 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center hover:bg-slate-50 -mx-2 px-2 rounded">
                      <div className="md:col-span-5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-label-mono text-[11px] font-bold text-slate-700">{t.id}</span>
                          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-label-mono font-bold uppercase ${h.cls}`}>{h.label}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-900 truncate">{t.title}</div>
                        <div className="text-[10px] font-label-mono text-slate-500 truncate">
                          {clientsById.get(t.clientId)?.name} • {idx === -1 ? "All phases done" : `${phaseLabel(idx)}: ${t.subtasks[idx].title}`}
                        </div>
                      </div>
                      <div className="md:col-span-5">
                        <div className="relative">
                          <ProgressTrack value={p} />
                          <span className="absolute -top-1 w-0.5 h-3.5 bg-slate-dark" style={{ left: `${exp}%` }} title={`Expected ${exp}%`} />
                        </div>
                        <div className="flex justify-between text-[10px] font-label-mono text-slate-500 mt-1">
                          <span className="font-bold text-slate-800">{p}% actual</span>
                          <span>{exp}% expected</span>
                        </div>
                      </div>
                      <div className="md:col-span-2 font-label-mono text-[11px] md:text-right">
                        <div className="text-slate-500 uppercase text-[10px]">End Date</div>
                        <div className={`font-semibold ${isOverdue(t) ? "text-error" : "text-slate-800"}`}>{formatDate(t.endDate)}</div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded p-6 flex flex-col gap-4 shadow-sm">
            <PanelTitle icon="groups" title="Crew Workload" iconClass="text-slate-700" />
            <div className="flex flex-col gap-2.5">
              {workload.map(({ e, tickets: count, open, done }) => (
                <div key={e.id} className="grid grid-cols-12 gap-3 items-center text-xs">
                  <div className="col-span-4 md:col-span-3 min-w-0">
                    <div className="font-bold text-slate-900 truncate">{e.name}</div>
                    <div className="text-[10px] font-label-mono text-slate-500">{e.id}</div>
                  </div>
                  <div className="col-span-5 md:col-span-7">
                    <div className="w-full bg-slate-100 h-3 rounded overflow-hidden">
                      <div className="bg-slate-dark h-full" style={{ width: `${(count / maxLoad) * 100}%` }} />
                    </div>
                  </div>
                  <div className="col-span-3 md:col-span-2 font-label-mono text-[10px] text-right">
                    <span className="font-bold text-slate-900">{count} jobs</span>
                    <div className="text-slate-500">
                      {done} done / {open} open
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="bg-white border border-slate-200 rounded p-5 flex flex-col gap-3 shadow-sm">
            <h3 className="text-xs font-label-mono uppercase tracking-wider text-slate-500 font-bold border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Tickets By Status</span>
              <Icon name="donut_small" className="text-sm text-slate-400" />
            </h3>
            {statuses.map((s) => {
              const n = tickets.filter((t) => t.status === s).length;
              return (
                <div key={s} className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] font-label-mono">
                    <span className="text-slate-600">{statusLabel[s]}</span>
                    <span className="font-bold text-slate-900">{n}</span>
                  </div>
                  <ProgressTrack value={(n / tickets.length) * 100} tone={s === "completed" ? "bg-industrial-green" : "bg-safety-orange"} />
                </div>
              );
            })}
          </section>

          <section className="bg-white border border-slate-200 rounded p-5 flex flex-col gap-3 shadow-sm">
            <h3 className="text-xs font-label-mono uppercase tracking-wider text-slate-500 font-bold border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Active By Priority</span>
              <Icon name="priority_high" className="text-sm text-slate-400" />
            </h3>
            {[...priorityOrder].reverse().map((p) => {
              const n = active.filter((t) => t.priority === p).length;
              return (
                <div key={p} className="flex justify-between items-center text-xs py-1 border-b border-slate-100 last:border-0">
                  <span className="text-slate-500 font-label-mono uppercase">{priorityLabel[p]}</span>
                  <span className="font-label-mono font-bold text-slate-900">{n}</span>
                </div>
              );
            })}
          </section>

          <section className="bg-slate-900 text-slate-300 rounded p-4 font-label-mono text-xs border border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
              <span className="text-slate-400 font-bold">CLIENT PORTFOLIO</span>
              <span className="text-safety-orange-bright text-[10px]">{clients.length} ACCOUNTS</span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              {clients.map((c) => {
                const jobs = tickets.filter((t) => t.clientId === c.id);
                const open = jobs.filter((t) => t.status !== "completed");
                return (
                  <Link key={c.id} href={`/admin/clients#${c.id}`} className="flex justify-between gap-2 hover:text-white">
                    <span className="text-slate-500 truncate">{c.name}</span>
                    <span className={open.some(isOverdue) ? "text-red-300" : "text-emerald-400"}>
                      {open.length}/{jobs.length}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
