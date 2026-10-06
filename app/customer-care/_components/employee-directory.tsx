"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icon";
import { employeeStatusLabel } from "@/lib/format";
import type { Employee } from "@/lib/types";
import { CommandBand } from "./ui";

export interface DirectoryEntry {
  employee: Employee;
  tickets: { id: string; title: string; holder: boolean; endDate: string }[];
}

const statusTone: Record<Employee["status"], string> = {
  on_site: "text-industrial-green",
  in_transit: "text-machinery-amber",
  available: "text-slate-dark",
  remote: "text-safety-orange",
  off_duty: "text-on-surface-variant",
};

export function EmployeeDirectory({ entries }: { entries: DirectoryEntry[] }) {
  const [query, setQuery] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  const q = query.trim().toLowerCase();
  const visible = entries.filter(
    ({ employee: e, tickets }) =>
      (!onlyActive || tickets.length > 0) &&
      (!q || [e.id, e.name, e.title, e.department, ...tickets.map((t) => t.id)].join(" ").toLowerCase().includes(q)),
  );

  return (
    <>
      <CommandBand>
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs text-safety-orange font-label-mono-sm text-label-mono-sm uppercase font-bold tracking-wider">
            <Icon name="badge" className="text-[16px]" /> Personnel Directory
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-primary">Employees &amp; Field Crew</h1>
        </div>
        <div className="flex items-stretch bg-surface-container-lowest rounded shadow-sm">
          <div className="flex items-center px-space-md">
            <Icon name="search" className="text-[22px] text-slate-dark" />
          </div>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Employee ID (EMP-402), name, role, or ticket ID..."
            className="w-full py-space-sm font-label-mono text-body-md text-on-surface bg-transparent focus:outline-none placeholder:text-on-surface-variant/60"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="px-space-md text-slate-dark hover:text-safety-orange" aria-label="Clear search">
              <Icon name="close" className="text-[20px]" />
            </button>
          )}
        </div>
        <label className="flex items-center gap-space-xs cursor-pointer select-none">
          <input checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} className="w-3.5 h-3.5 accent-safety-orange" type="checkbox" />
          <span className="font-label-mono-sm text-label-mono-sm text-primary-fixed-dim uppercase">Only employees on active tickets</span>
        </label>
      </CommandBand>

      <div className="w-full max-w-[1440px] mx-auto px-gutter py-space-lg">
        <div className="flex items-center justify-between mb-space-md">
          <span className="font-headline-sm text-headline-sm uppercase text-slate-dark">{visible.length} Personnel</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-md">
          {visible.map(({ employee: e, tickets }) => (
            <div key={e.id} className="bg-surface-container-lowest p-space-md rounded shadow-sm flex flex-col gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <div className="w-12 h-12 rounded bg-slate-dark text-on-primary flex items-center justify-center font-label-mono font-bold shrink-0">
                  {e.initials}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-headline-sm text-headline-sm text-slate-dark truncate">{e.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-dark text-on-primary font-label-mono-sm text-label-mono-sm">{e.id}</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    {e.title} • {e.department}
                  </span>
                  <span className={`font-label-mono-sm text-label-mono-sm font-bold uppercase ${statusTone[e.status]}`}>
                    {employeeStatusLabel[e.status]} — {e.location}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-space-xs">
                <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">Active Tickets ({tickets.length})</span>
                {tickets.length === 0 && <span className="font-body-sm text-body-sm text-on-surface-variant">Not assigned to any active ticket.</span>}
                {tickets.map((t) => (
                  <Link
                    key={t.id}
                    href={`/customer-care/tickets/${t.id}`}
                    className="flex items-center justify-between gap-space-xs p-space-xs rounded bg-surface-container-low hover:bg-surface-container font-body-sm text-body-sm"
                  >
                    <span className="flex items-center gap-space-xs min-w-0">
                      <span className="font-label-mono-sm text-label-mono-sm font-bold text-safety-orange">#{t.id}</span>
                      <span className="truncate text-on-surface">{t.title}</span>
                    </span>
                    <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant shrink-0">
                      {t.holder ? "HOLDER • " : ""}
                      {t.endDate}
                    </span>
                  </Link>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-space-xs pt-space-xs mt-auto">
                <a
                  href={`tel:${e.phone.replace(/[^\d+]/g, "")}`}
                  className="px-space-sm py-2 rounded bg-surface hover:bg-surface-container-high text-on-surface font-label-mono text-label-mono flex items-center justify-center gap-space-xs shadow-sm"
                >
                  <Icon name="call" className="text-[16px] text-safety-orange" /> {e.phone}
                </a>
                <a
                  href={`mailto:${e.email}`}
                  className="px-space-sm py-2 rounded bg-slate-dark hover:bg-primary-container text-on-primary font-label-mono text-label-mono flex items-center justify-center gap-space-xs shadow-sm"
                >
                  <Icon name="mail" className="text-[16px] text-safety-orange-bright" /> Email
                </a>
              </div>
            </div>
          ))}
        </div>
        {visible.length === 0 && (
          <div className="bg-surface-container-lowest p-space-lg rounded shadow-sm text-center font-label-mono text-label-mono text-on-surface-variant">
            No employee matches “{query}”.
          </div>
        )}
      </div>
    </>
  );
}
