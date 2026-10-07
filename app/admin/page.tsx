import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { getAdminUser, getClients, getEmployees, getTickets } from "@/lib/db-data";
import {
  employeeStatusLabel,
  formatDateTime,
  getClient,
  getEmployee,
  isOverdue,
  priorityLabel,
  remainingLabel,
  ticketProgress,
  urgency,
} from "@/lib/tickets";
import { PageTitle, PanelTitle, PhaseGrid, PriorityPill, StatCard, StatusPill } from "./_components/ui";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  const [adminUser, clients, employees, tickets] = await Promise.all([getAdminUser(), getClients(), getEmployees(), getTickets()]);
  const clientsById = new Map(clients.map((client) => [client.id, client]));
  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));
  const active = tickets.filter((t) => t.status !== "completed").sort((a, b) => urgency(b) - urgency(a));
  const focus = active[0];
  const pendingRequests = tickets.flatMap((t) => t.priorityRequests.map((r) => ({ t, r })));
  const recent = tickets
    .flatMap((t) => t.activity.map((a) => ({ t, a })))
    .sort((x, y) => y.a.at.localeCompare(x.a.at))
    .slice(0, 5);

  return (
    <>
      <PageTitle
        badges={
          <span className="bg-emerald-50 text-industrial-green px-2.5 py-0.5 rounded text-xs font-label-mono font-semibold border border-emerald-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-industrial-green animate-ping"></span>
            OPERATIONS LIVE
          </span>
        }
        title={`Good day, ${adminUser.name.split(" ")[0]} — Operations Overview`}
        actions={
          <>
            <Link
              href="/admin/employees#add-employee"
              className="bg-safety-orange hover:bg-safety-orange-bright text-white py-2 px-4 rounded text-xs font-label-mono font-bold tracking-wide uppercase shadow transition-all flex items-center gap-2"
            >
              <Icon name="person_add" className="text-base" /> Add Employee
            </Link>
            <Link
              href="/admin/reports"
              className="border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 py-2 px-4 rounded text-xs font-label-mono font-semibold transition-colors flex items-center gap-1"
            >
              <Icon name="monitoring" className="text-sm text-slate-600" /> Progress Reports
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Active Tickets" value={active.length} icon="confirmation_number" sub={`${tickets.length} total`} />
        <StatCard label="Critical" value={active.filter((t) => t.priority === "critical").length} icon="warning" tone="text-error" />
        <StatCard label="Overdue" value={active.filter(isOverdue).length} icon="alarm" tone="text-machinery-amber" />
        <StatCard
          label="Crew On Duty"
          value={employees.filter((e) => e.status !== "off_duty").length}
          icon="engineering"
          tone="text-industrial-green"
          sub={`${employees.length} on roster`}
        />
        <StatCard label="Clients" value={clients.length} icon="corporate_fare" tone="text-slate-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 flex flex-col gap-6">
          {focus && (
            <section className="bg-white border border-slate-200 rounded p-5 flex flex-col gap-4 shadow-sm">
              <PanelTitle
                icon="emergency_home"
                title={
                  <>
                    Most Urgent: <span className="text-safety-orange">{focus.id}</span>
                  </>
                }
                right={
                  <Link
                    href={`/admin/tickets/${focus.id}`}
                    className="text-xs font-label-mono text-slate-600 hover:text-safety-orange border border-slate-200 px-2 py-0.5 rounded hover:bg-slate-50 transition-colors"
                  >
                    Open Ticket
                  </Link>
                }
              />
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-900">{focus.title}</span>
                <PriorityPill priority={focus.priority} />
                <span className="font-label-mono text-slate-500">
                  {clientsById.get(focus.clientId)?.name} • {remainingLabel(focus)}
                </span>
              </div>
              <PhaseGrid subtasks={focus.subtasks} />
            </section>
          )}

          <section className="bg-white border border-slate-200 rounded p-6 flex flex-col gap-4 shadow-sm">
            <PanelTitle
              icon="confirmation_number"
              title="Live Ticket Board"
              right={
                <Link href="/admin/tickets" className="text-xs font-label-mono text-slate-500 hover:text-safety-orange">
                  VIEW ALL →
                </Link>
              }
            />
            <div className="flex flex-col divide-y divide-slate-100">
              {active.map((t) => {
                const p = ticketProgress(t);
                const holder = employeesById.get(t.ownerId)!;
                return (
                  <Link key={t.id} href={`/admin/tickets/${t.id}`} className="py-3 flex flex-col md:flex-row md:items-center gap-3 hover:bg-slate-50 -mx-2 px-2 rounded">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-label-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 rounded border border-slate-300">{t.id}</span>
                        <StatusPill status={t.status} />
                      </div>
                      <div className="text-xs font-bold text-slate-900 truncate">{t.title}</div>
                      <div className="text-[10px] font-label-mono text-slate-500">
                        {clientsById.get(t.clientId)?.name} • Holder: {holder.name} • {priorityLabel[t.priority]}
                      </div>
                    </div>
                    <div className="md:w-48">
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className={`${isOverdue(t) ? "bg-error" : "bg-safety-orange"} h-full`} style={{ width: `${p}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] font-label-mono mt-1">
                        <span className="font-bold text-slate-800">{p}%</span>
                        <span className={isOverdue(t) ? "text-error font-bold" : "text-slate-500"}>{remainingLabel(t)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="bg-white border-2 border-safety-orange/40 rounded p-5 flex flex-col gap-3 shadow-sm">
            <div className="text-[11px] font-label-mono uppercase tracking-wider text-slate-500 font-bold flex items-center justify-between">
              <span>PRIORITY CHANGE REQUESTS</span>
              <span className="w-2 h-2 rounded-full bg-safety-orange animate-pulse"></span>
            </div>
            {pendingRequests.length === 0 && <p className="text-xs text-slate-500">No requests from customer care.</p>}
            {pendingRequests.map(({ t, r }) => (
              <Link key={r.id} href={`/admin/tickets/${t.id}`} className="p-2.5 bg-slate-50 border border-slate-200 rounded hover:border-safety-orange">
                <div className="flex justify-between text-[11px] font-label-mono">
                  <span className="font-bold text-slate-800">{t.id}</span>
                  <span className="uppercase text-slate-500">{r.status}</span>
                </div>
                <div className="text-xs text-slate-700">
                  {priorityLabel[r.from]} → <span className="font-bold">{priorityLabel[r.to]}</span>
                </div>
              </Link>
            ))}
          </section>

          <section className="bg-white border border-slate-200 rounded p-5 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Icon name="engineering" className="text-safety-orange text-base" />
                <h3 className="text-xs font-label-mono uppercase tracking-wider text-slate-800 font-bold">Crew Status</h3>
              </div>
              <Link href="/admin/employees" className="text-[11px] font-label-mono text-slate-500 hover:text-safety-orange">
                Manage
              </Link>
            </div>
            {employees.slice(0, 6).map((e) => (
              <div key={e.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
                <div className="flex items-center gap-2">
                  <Avatar employee={e} size={28} className="rounded border border-slate-300" fallbackClassName="bg-slate-800 text-white" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900 leading-tight">{e.name}</span>
                    <span className="text-[10px] font-label-mono text-slate-500">{e.title}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-label-mono font-semibold ${e.status === "off_duty" ? "text-slate-400" : "text-industrial-green"}`}>
                  {employeeStatusLabel[e.status]}
                </span>
              </div>
            ))}
          </section>

          <section className="bg-slate-900 text-slate-300 rounded p-4 font-label-mono text-xs border border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
              <span className="text-slate-400 font-bold">RECENT ACTIVITY</span>
              <span className="text-safety-orange-bright text-[10px]">LIVE FEED</span>
            </div>
            <div className="space-y-2 text-[11px]">
              {recent.map(({ t, a }) => (
                <Link key={`${t.id}-${a.id}`} href={`/admin/tickets/${t.id}`} className="block hover:text-white">
                  <div className="flex justify-between">
                    <span className="text-amber-400">{t.id}</span>
                    <span className="text-slate-500">{formatDateTime(a.at)}</span>
                  </div>
                  <div className="text-slate-300 line-clamp-2">
                    <span className="text-slate-500">{a.authorName}:</span> {a.text}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
