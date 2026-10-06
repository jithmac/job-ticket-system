"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icon";
import type { Priority, TicketStatus } from "@/lib/types";
import { PriorityBadge, ProgressBar, StatusBadge } from "./ui";

export interface TicketRow {
  id: string;
  jobId: string;
  title: string;
  client: string;
  holder: string;
  isHolder: boolean;
  role: "Holder" | "Participant" | "Creator";
  priority: Priority;
  status: TicketStatus;
  progress: number;
  endDate: string;
  remaining: string;
  overdue: boolean;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "holding", label: "Holding" },
  { key: "completed", label: "Completed" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function matches(row: TicketRow, filter: FilterKey) {
  if (filter === "active") return row.status !== "completed";
  if (filter === "holding") return row.isHolder && row.status !== "completed";
  if (filter === "completed") return row.status === "completed";
  return true;
}

/** Filterable / searchable list of the signed-in employee's tickets. */
export function TicketsTable({ rows }: { rows: TicketRow[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const visible = rows.filter(
    (r) => matches(r, filter) && (!q || `${r.id} ${r.jobId} ${r.title} ${r.client}`.toLowerCase().includes(q)),
  );

  return (
    <div className="bg-surface-container-lowest border border-slate-border rounded-lg shadow-sm overflow-hidden">
      <div className="p-3.5 border-b border-slate-border bg-slate-surface flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5" role="tablist">
          {FILTERS.map((f) => {
            const count = rows.filter((r) => matches(r, f.key)).length;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded font-label-mono text-xs font-semibold border transition-colors ${
                  active
                    ? "bg-slate-dark text-white border-slate-dark"
                    : "bg-white text-on-surface-variant border-slate-border hover:border-slate-400"
                }`}
              >
                {f.label} <span className={active ? "text-safety-orange" : "text-outline"}>({count})</span>
              </button>
            );
          })}
        </div>
        <div className="relative custom-focus-ring rounded md:w-72">
          <Icon name="search" className="absolute left-2.5 top-2 text-sm text-outline" />
          <input
            className="form-input w-full border border-slate-border rounded pl-8 pr-3 py-1.5 text-xs bg-white placeholder:text-outline focus:ring-0 focus:outline-none font-label-mono"
            placeholder="Search ticket ID, job ID, title, client..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left font-label-mono text-[10px] uppercase tracking-wider text-on-surface-variant border-b border-slate-border">
              <th className="px-4 py-2.5 font-semibold">Ticket</th>
              <th className="px-4 py-2.5 font-semibold">Job Title / Client</th>
              <th className="px-4 py-2.5 font-semibold">Holder</th>
              <th className="px-4 py-2.5 font-semibold">Priority</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold w-36">Progress</th>
              <th className="px-4 py-2.5 font-semibold">End Date</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-border">
            {visible.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 align-top">
                  <Link href={`/employee/tickets/${r.id}`} className="font-label-mono font-bold text-safety-orange hover:underline">
                    #{r.id}
                  </Link>
                  <div className="text-[10px] font-label-mono text-on-surface-variant">{r.role}</div>
                </td>
                <td className="px-4 py-3 align-top max-w-xs">
                  <p className="font-semibold text-on-surface line-clamp-1">{r.title}</p>
                  <p className="text-[11px] text-on-surface-variant">{r.client}</p>
                </td>
                <td className="px-4 py-3 align-top font-label-mono text-slate-dark">
                  {r.holder}
                  {r.isHolder && <span className="text-safety-orange"> (You)</span>}
                </td>
                <td className="px-4 py-3 align-top">
                  <PriorityBadge priority={r.priority} />
                </td>
                <td className="px-4 py-3 align-top">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={r.progress} />
                    <span className="font-label-mono text-[10px] font-bold text-slate-dark w-8 text-right">{r.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 align-top font-label-mono">
                  <div className="text-slate-dark font-semibold">{r.endDate}</div>
                  <div className={`text-[10px] ${r.overdue ? "text-error font-bold" : "text-on-surface-variant"}`}>{r.remaining}</div>
                </td>
                <td className="px-4 py-3 align-top text-right">
                  <Link
                    href={`/employee/tickets/${r.id}`}
                    className="inline-flex items-center gap-1 font-label-mono font-semibold text-slate-dark hover:text-safety-orange transition-colors"
                  >
                    Open <Icon name="arrow_forward" className="text-xs" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-slate-border">
        {visible.map((r) => (
          <Link key={r.id} href={`/employee/tickets/${r.id}`} className="block p-3.5 hover:bg-slate-50">
            <div className="flex items-center justify-between mb-1">
              <span className="font-label-mono text-xs font-bold text-safety-orange">#{r.id}</span>
              <StatusBadge status={r.status} />
            </div>
            <p className="font-semibold text-sm text-on-surface line-clamp-1">{r.title}</p>
            <p className="text-[11px] text-on-surface-variant mb-2">
              {r.client} • ends {r.endDate}
            </p>
            <ProgressBar value={r.progress} />
          </Link>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="p-8 text-center text-xs font-label-mono text-on-surface-variant">No tickets match this filter.</p>
      )}
    </div>
  );
}
