"use client";

import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { employeeStatusLabel } from "@/lib/format";
import type { Employee } from "@/lib/types";
import { AddEmployeeForm } from "./add-employee-form";

const statusTone: Record<Employee["status"], string> = {
  on_site: "bg-emerald-50 text-emerald-800 border-emerald-300",
  in_transit: "bg-amber-100 text-amber-900 border-amber-300",
  available: "bg-slate-100 text-slate-700 border-slate-300",
  remote: "bg-orange-50 text-safety-orange border-safety-orange/30",
  off_duty: "bg-slate-50 text-slate-400 border-slate-200",
};

/** Roster table + add form sharing one list, so additions/removals show immediately. */
export function EmployeeRoster({
  initial,
  workload,
  departments,
  skillLevels,
}: {
  initial: Employee[];
  /** employeeId -> active ticket count */
  workload: Record<string, number>;
  departments: readonly string[];
  skillLevels: readonly string[];
}) {
  const [roster, setRoster] = useState(initial);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("");
  const [removed, setRemoved] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const visible = roster.filter(
    (e) => (!dept || e.department === dept) && (!q || `${e.id} ${e.name} ${e.title}`.toLowerCase().includes(q)),
  );

  function remove(id: string) {
    const e = roster.find((x) => x.id === id);
    setRoster((r) => r.filter((x) => x.id !== id));
    setConfirming(null);
    setRemoved(e ? `${e.name} (${e.id}) removed from the roster.` : null);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <section className="lg:col-span-2 bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h2 className="text-base font-headline-md font-bold text-slate-900 flex items-center gap-2">
            <Icon name="badge" className="text-safety-orange text-lg" />
            Operations Roster
            <span className="text-xs font-label-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-normal">
              {roster.length} Members
            </span>
          </h2>
          <div className="flex gap-1.5">
            <select
              aria-label="Department"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="form-select text-xs font-label-mono bg-slate-50 border border-slate-200 text-slate-800 rounded pl-2 pr-8 py-1.5 outline-none focus:border-safety-orange"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <div className="relative">
              <Icon name="search" className="absolute left-2.5 top-2 text-slate-400 text-sm" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name or EMP ID..."
                className="form-input w-44 pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-label-mono text-slate-800 placeholder:text-slate-400 focus:border-safety-orange focus:ring-1 focus:ring-safety-orange outline-none"
              />
            </div>
          </div>
        </div>
        {removed && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-xs font-label-mono text-red-700 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Icon name="person_remove" className="text-sm" /> {removed}
            </span>
            <button type="button" onClick={() => setRemoved(null)} className="hover:text-slate-900">
              <Icon name="close" className="text-sm" />
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[720px]">
            <thead>
              <tr className="text-left text-[11px] font-label-mono uppercase text-slate-500 bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-2.5 font-semibold">Employee</th>
                <th className="px-4 py-2.5 font-semibold">Department / Skill</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Active Jobs</th>
                <th className="px-4 py-2.5 font-semibold">Contact</th>
                <th className="px-4 py-2.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        employee={e}
                        size={32}
                        className="rounded border border-slate-300"
                        fallbackClassName="bg-slate-800 text-white border border-slate-700"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{e.name}</div>
                        <div className="text-[10px] font-label-mono text-slate-500">
                          {e.id} • {e.title}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-label-mono">
                    <div className="text-slate-800">{e.department}</div>
                    <div className="text-[10px] text-slate-500">{e.skillLevel}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-label-mono font-bold uppercase ${statusTone[e.status]}`}>
                      {employeeStatusLabel[e.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-label-mono font-bold text-slate-800">{workload[e.id] ?? 0}</td>
                  <td className="px-4 py-3 font-label-mono text-[11px] text-slate-600">
                    <div>{e.email}</div>
                    <div className="text-slate-400">{e.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {confirming === e.id ? (
                      <span className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => remove(e.id)}
                          className="px-2 py-1 rounded bg-red-700 text-white text-[10px] font-label-mono font-bold"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(null)}
                          className="px-2 py-1 rounded border border-slate-300 text-slate-600 text-[10px] font-label-mono"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirming(e.id)}
                        className="border border-slate-300 bg-slate-50 hover:bg-red-50 hover:border-red-300 text-slate-700 hover:text-red-700 px-2 py-1 rounded text-[10px] font-label-mono font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <Icon name="person_remove" className="text-sm" /> Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && <p className="p-8 text-center text-xs font-label-mono text-slate-400">No employees match.</p>}
        </div>
      </section>

      <div className="flex flex-col gap-6">
        <AddEmployeeForm
          activeCount={roster.filter((e) => e.status !== "off_duty").length}
          departments={departments}
          skillLevels={skillLevels}
          onAdd={(e) => setRoster((r) => [e, ...r])}
        />
        <section className="bg-slate-900 text-slate-300 rounded p-4 font-label-mono text-xs border border-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <span className="text-slate-400 font-bold">CREW AVAILABILITY</span>
            <span className="text-safety-orange-bright text-[10px]">LIVE</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            {(Object.keys(statusTone) as Employee["status"][]).map((s) => (
              <div key={s} className="flex justify-between">
                <span className="text-slate-500">{employeeStatusLabel[s]}:</span>
                <span className={s === "off_duty" ? "text-slate-400" : "text-emerald-400"}>
                  {roster.filter((e) => e.status === s).length}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
