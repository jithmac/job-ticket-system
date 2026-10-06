import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { tickets } from "@/lib/data";
import {
  activeSubtaskIndex,
  daysRemaining,
  formatDate,
  getClient,
  getEmployee,
  isOverdue,
  remainingLabel,
  ticketProgress,
} from "@/lib/tickets";
import { CommandBand, PriorityTag } from "../_components/ui";

export const metadata: Metadata = { title: "Progress Reports" };

export default function CareReportsPage() {
  const active = tickets.filter((t) => t.status !== "completed").sort((a, b) => a.endDate.localeCompare(b.endDate));
  const done = tickets.filter((t) => t.status === "completed");
  const dueSoon = active.filter((t) => daysRemaining(t) >= 0 && daysRemaining(t) <= 7);
  const overdue = active.filter(isOverdue);

  const stats = [
    { label: "Active Jobs", value: active.length, tone: "text-on-primary" },
    { label: "Due In 7 Days", value: dueSoon.length, tone: "text-safety-orange-bright" },
    { label: "Overdue", value: overdue.length, tone: "text-red-300" },
    { label: "Delivered", value: done.length, tone: "text-industrial-green-bright" },
  ];

  return (
    <>
      <CommandBand>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs text-safety-orange font-label-mono-sm text-label-mono-sm uppercase font-bold tracking-wider">
              <Icon name="monitoring" className="text-[16px]" /> Execution Protocol
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-primary">Progress Reports &amp; End Dates</h1>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
            {stats.map((s) => (
              <div key={s.label} className="px-space-md py-space-sm rounded bg-surface-container-lowest/10">
                <div className={`font-headline-md text-headline-md ${s.tone}`}>{s.value}</div>
                <div className="font-label-mono-sm text-label-mono-sm text-primary-fixed-dim uppercase">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </CommandBand>

      <div className="w-full max-w-[1440px] mx-auto px-gutter py-space-lg flex flex-col gap-space-lg">
        <div className="bg-surface-container-lowest rounded shadow-sm overflow-hidden">
          <div className="p-space-md flex items-center gap-space-xs border-b border-slate-border/30">
            <Icon name="event" className="text-safety-orange text-[20px]" />
            <h3 className="font-headline-sm text-headline-sm uppercase text-slate-dark">Active Jobs by End Date</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="text-left font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant bg-surface-container-low">
                  <th className="px-space-md py-space-sm">Ticket / Job</th>
                  <th className="px-space-md py-space-sm">Client</th>
                  <th className="px-space-md py-space-sm">Current Phase</th>
                  <th className="px-space-md py-space-sm w-48">Progress</th>
                  <th className="px-space-md py-space-sm">Start → End</th>
                  <th className="px-space-md py-space-sm">Holder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-border/30">
                {active.map((t) => {
                  const p = ticketProgress(t);
                  const idx = activeSubtaskIndex(t);
                  const late = isOverdue(t);
                  return (
                    <tr key={t.id} className="hover:bg-surface-container-low font-body-sm text-body-sm">
                      <td className="px-space-md py-space-sm align-top">
                        <Link href={`/customer-care/tickets/${t.id}`} className="font-label-mono text-label-mono font-bold text-safety-orange hover:underline">
                          #{t.id}
                        </Link>
                        <div className="font-bold text-slate-dark line-clamp-1 max-w-xs">{t.title}</div>
                        <div className="mt-1">
                          <PriorityTag priority={t.priority} suffix={false} />
                        </div>
                      </td>
                      <td className="px-space-md py-space-sm align-top text-on-surface">{getClient(t.clientId)?.name}</td>
                      <td className="px-space-md py-space-sm align-top text-on-surface-variant">
                        {idx === -1 ? "Awaiting sign-off" : `${idx + 1}/${t.subtasks.length} • ${t.subtasks[idx].title}`}
                      </td>
                      <td className="px-space-md py-space-sm align-top">
                        <div className="flex items-center justify-between font-label-mono-sm text-label-mono-sm mb-1">
                          <span className="font-bold text-slate-dark">{p}%</span>
                        </div>
                        <div className="w-full bg-surface-container-high h-2 rounded overflow-hidden">
                          <div className={`${late ? "bg-error" : "bg-safety-orange"} h-full rounded`} style={{ width: `${p}%` }} />
                        </div>
                      </td>
                      <td className="px-space-md py-space-sm align-top font-label-mono text-label-mono">
                        <div className="text-slate-dark">
                          {formatDate(t.startDate)} → <span className="font-bold">{formatDate(t.endDate)}</span>
                        </div>
                        <div className={`font-label-mono-sm text-label-mono-sm font-bold ${late ? "text-error" : daysRemaining(t) <= 3 ? "text-machinery-amber" : "text-industrial-green"}`}>
                          {remainingLabel(t)}
                        </div>
                      </td>
                      <td className="px-space-md py-space-sm align-top font-label-mono text-label-mono text-slate-dark">{getEmployee(t.ownerId)?.name}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded shadow-sm p-space-md flex flex-col gap-space-sm">
          <div className="flex items-center gap-space-xs">
            <Icon name="task_alt" className="text-industrial-green text-[20px]" />
            <h3 className="font-headline-sm text-headline-sm uppercase text-slate-dark">Recently Delivered</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
            {done.map((t) => (
              <Link key={t.id} href={`/customer-care/tickets/${t.id}`} className="p-space-sm rounded bg-surface-container-low hover:bg-surface-container flex flex-col gap-1">
                <span className="font-label-mono text-label-mono font-bold text-slate-dark">#{t.id}</span>
                <span className="font-body-sm text-body-sm font-bold text-slate-dark line-clamp-1">{t.title}</span>
                <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                  {getClient(t.clientId)?.name} • Closed {formatDate(t.endDate)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
