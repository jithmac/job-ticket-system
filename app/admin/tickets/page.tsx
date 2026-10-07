import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { getClients, getEmployees, getTickets } from "@/lib/db-data";
import {
  formatDate,
  getClient,
  getEmployee,
  isOverdue,
  remainingLabel,
  ticketCrew,
  ticketProgress,
  urgency,
} from "@/lib/tickets";
import type { Ticket } from "@/lib/types";
import { PageTitle, PriorityPill, ProgressTrack, StatusPill } from "../_components/ui";

export const metadata: Metadata = { title: "Tickets" };

const FILTERS = [
  { key: "all", label: "All", test: () => true },
  { key: "active", label: "Active", test: (t: Ticket) => t.status !== "completed" },
  { key: "critical", label: "Critical", test: (t: Ticket) => t.priority === "critical" && t.status !== "completed" },
  { key: "overdue", label: "Overdue", test: (t: Ticket) => isOverdue(t) },
  { key: "signoff", label: "Awaiting Sign-Off", test: (t: Ticket) => t.status === "awaiting_signoff" },
  { key: "completed", label: "Completed", test: (t: Ticket) => t.status === "completed" },
] as const;

/**
 * Filtering happens on the server from the URL (?q=…&filter=…), so results are
 * shareable/bookmarkable and the header search can link straight here.
 */
export default async function AdminTicketsPage({ searchParams }: PageProps<"/admin/tickets">) {
  const sp = await searchParams;
  const [tickets, clients, employees] = await Promise.all([getTickets(), getClients(), getEmployees()]);
  const clientsById = new Map(clients.map((client) => [client.id, client]));
  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const filterKey = typeof sp.filter === "string" ? sp.filter : "all";
  const filter = FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0];

  const rows = tickets
    .filter((t) => {
      const crew = [t.ownerId, ...t.participantIds].map((id) => employeesById.get(id)?.name ?? id).join(" ");
      const searchable = `${t.id} ${t.jobId} ${t.title} ${clientsById.get(t.clientId)?.name ?? ""} ${t.category} ${crew}`.toLowerCase();
      return filter.test(t) && (!q || searchable.includes(q.toLowerCase()));
    })
    .sort((a, b) => urgency(b) - urgency(a));

  const hrefFor = (key: string) => {
    const params = new URLSearchParams();
    if (key !== "all") params.set("filter", key);
    if (q) params.set("q", q);
    const s = params.toString();
    return s ? `/admin/tickets?${s}` : "/admin/tickets";
  };

  return (
    <>
      <PageTitle
        badges={
          <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded text-xs font-label-mono font-semibold border border-slate-300">
            {tickets.length} TOTAL TICKETS
          </span>
        }
        title="Ticket Console"
      />

      <section className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const active = f.key === filter.key;
              return (
                <Link
                  key={f.key}
                  href={hrefFor(f.key)}
                  className={`px-3 py-1.5 rounded text-xs font-label-mono flex items-center gap-1.5 border transition-colors ${
                    active
                      ? "bg-slate-dark text-safety-orange border-safety-orange/30 font-semibold"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {f.label}
                  <span className={active ? "text-slate-300" : "text-slate-400"}>({tickets.filter(f.test).length})</span>
                </Link>
              );
            })}
          </div>
          <Form action="/admin/tickets" className="flex gap-1.5 lg:w-80">
            {filter.key !== "all" && <input type="hidden" name="filter" value={filter.key} />}
            <div className="relative w-full">
              <Icon name="search" className="absolute left-2.5 top-2 text-slate-400 text-sm" />
              <input
                name="q"
                defaultValue={q}
                type="search"
                placeholder="Ticket / job ID, client, employee..."
                className="form-input w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-label-mono text-slate-800 placeholder:text-slate-400 focus:border-safety-orange focus:ring-1 focus:ring-safety-orange outline-none"
              />
            </div>
            <button className="bg-slate-dark hover:bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-label-mono font-bold">Search</button>
          </Form>
        </div>

        {q && (
          <div className="px-4 py-2 bg-orange-50/50 border-b border-slate-100 text-xs font-label-mono text-slate-600 flex items-center justify-between">
            <span>
              {rows.length} result{rows.length === 1 ? "" : "s"} for “<span className="font-bold text-slate-900">{q}</span>”
            </span>
            <Link href={filter.key === "all" ? "/admin/tickets" : `/admin/tickets?filter=${filter.key}`} className="text-safety-orange font-semibold hover:underline">
              Clear search
            </Link>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr className="text-left text-[11px] font-label-mono uppercase text-slate-500 bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-2.5 font-semibold">Ticket / Job</th>
                <th className="px-4 py-2.5 font-semibold">Title &amp; Client</th>
                <th className="px-4 py-2.5 font-semibold">Holder / Crew</th>
                <th className="px-4 py-2.5 font-semibold">Priority</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold w-40">Progress</th>
                <th className="px-4 py-2.5 font-semibold">End Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((t) => {
                const holder = employeesById.get(t.ownerId)!;
                const progress = ticketProgress(t);
                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 align-top">
                      <Link href={`/admin/tickets/${t.id}`} className="font-label-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 hover:border-safety-orange hover:text-safety-orange">
                        {t.id}
                      </Link>
                      <div className="text-[10px] font-label-mono text-slate-400 mt-1">{t.jobId}</div>
                    </td>
                    <td className="px-4 py-3 align-top max-w-xs">
                      <Link href={`/admin/tickets/${t.id}`} className="font-bold text-slate-900 hover:text-safety-orange line-clamp-1">
                        {t.title}
                      </Link>
                      <div className="text-[11px] text-slate-500 font-label-mono">{clientsById.get(t.clientId)?.name}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <Avatar employee={holder} size={24} className="rounded border border-slate-300" />
                        <div>
                          <div className="font-semibold text-slate-800">{holder.name}</div>
                          <div className="text-[10px] font-label-mono text-slate-400">+{t.participantIds.length} crew</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <PriorityPill priority={t.priority} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <StatusPill status={t.status} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        <ProgressTrack value={progress} />
                        <span className="font-label-mono font-bold text-slate-700 w-9 text-right">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top font-label-mono">
                      <div className="text-slate-800 font-semibold">{formatDate(t.endDate)}</div>
                      <div className={`text-[10px] ${isOverdue(t) ? "text-error font-bold" : "text-slate-400"}`}>{remainingLabel(t)}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-10 text-center text-xs font-label-mono text-slate-400">No tickets match.</p>}
        </div>
      </section>
    </>
  );
}
