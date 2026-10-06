import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { clients } from "@/lib/data";
import { formatDate, getEmployee, remainingLabel, ticketProgress, ticketsForClient } from "@/lib/tickets";
import { PageTitle, ProgressTrack, StatusPill } from "../_components/ui";

export const metadata: Metadata = { title: "Clients & Jobs" };

export default function AdminClientsPage() {
  return (
    <>
      <PageTitle
        badges={
          <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded text-xs font-label-mono font-semibold border border-slate-300">
            {clients.length} ACCOUNTS
          </span>
        }
        title="Clients & Jobs"
      />
      <div className="flex flex-col gap-6">
        {clients.map((c) => {
          const jobs = ticketsForClient(c.id).sort((a, b) => b.startDate.localeCompare(a.startDate));
          const active = jobs.filter((j) => j.status !== "completed").length;
          return (
            <section key={c.id} id={c.id} className="bg-white border border-slate-200 rounded p-6 flex flex-col gap-4 shadow-sm scroll-mt-24">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <Icon name="corporate_fare" className="text-slate-700 text-lg" />
                  <h2 className="text-base font-headline-md font-bold text-slate-900">{c.name}</h2>
                  <span className="font-label-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">{c.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-label-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-industrial-green"></span> {c.tier.toUpperCase()}
                  </span>
                  <span className="text-xs font-label-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {active} Active • {jobs.length - active} Closed
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded border border-slate-200">
                <div className="space-y-1">
                  <div className="text-[11px] font-label-mono uppercase text-slate-500 font-semibold">Facility</div>
                  <div className="text-sm font-bold text-slate-900">{c.facility}</div>
                  <div className="text-xs text-slate-600 font-label-mono">{c.address}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] font-label-mono uppercase text-slate-500 font-semibold">Account Liaison</div>
                  <div className="text-sm font-bold text-slate-900">
                    {c.contactName} <span className="text-xs font-normal text-slate-500">— {c.contactRole}</span>
                  </div>
                  <div className="text-xs text-slate-600 font-label-mono break-all">
                    {c.contactEmail} • {c.contactPhone}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] font-label-mono uppercase text-slate-500 font-semibold">Contract &amp; Site Access</div>
                  <div className="text-xs font-bold text-industrial-green-deep flex items-center gap-1">
                    <Icon name="verified" className="text-sm" /> {c.contractRef}
                  </div>
                  <div className="text-[11px] text-slate-500 font-label-mono">{c.accessLevel}</div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[720px]">
                  <thead>
                    <tr className="text-left text-[11px] font-label-mono uppercase text-slate-500 border-b border-slate-200">
                      <th className="py-2 pr-4 font-semibold">Job</th>
                      <th className="py-2 pr-4 font-semibold">Title</th>
                      <th className="py-2 pr-4 font-semibold">Holder</th>
                      <th className="py-2 pr-4 font-semibold">Status</th>
                      <th className="py-2 pr-4 font-semibold w-40">Progress</th>
                      <th className="py-2 font-semibold">Schedule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jobs.map((j) => {
                      const p = ticketProgress(j);
                      return (
                        <tr key={j.id} className="hover:bg-slate-50">
                          <td className="py-2.5 pr-4 font-label-mono">
                            <Link href={`/admin/tickets/${j.id}`} className="font-bold text-slate-700 hover:text-safety-orange">
                              {j.jobId}
                            </Link>
                            <div className="text-[10px] text-slate-400">{j.id}</div>
                          </td>
                          <td className="py-2.5 pr-4 font-semibold text-slate-900 max-w-xs">
                            <Link href={`/admin/tickets/${j.id}`} className="hover:text-safety-orange line-clamp-1">
                              {j.title}
                            </Link>
                          </td>
                          <td className="py-2.5 pr-4 font-label-mono text-slate-700">{getEmployee(j.ownerId)?.name}</td>
                          <td className="py-2.5 pr-4">
                            <StatusPill status={j.status} />
                          </td>
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-2">
                              <ProgressTrack value={p} />
                              <span className="font-label-mono font-bold text-slate-700 w-9 text-right">{p}%</span>
                            </div>
                          </td>
                          <td className="py-2.5 font-label-mono">
                            <div className="text-slate-800">
                              {formatDate(j.startDate)} → {formatDate(j.endDate)}
                            </div>
                            <div className="text-[10px] text-slate-400">{remainingLabel(j)}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
