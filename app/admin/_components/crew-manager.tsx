"use client";

import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { employeeStatusLabel } from "@/lib/format";
import type { Employee } from "@/lib/types";
import { SideTitle } from "./ui";

type Role = "Lead (Holder)" | "Support Tech" | "Safety Officer" | "Observer";
const ROLES: Role[] = ["Lead (Holder)", "Support Tech", "Safety Officer", "Observer"];

interface Member {
  employee: Employee;
  role: Role;
}

/** "Assigned Crew & Technicians" card: change roles, remove, or add employees to a ticket. */
export function CrewManager({ crew, ownerId, roster }: { crew: Employee[]; ownerId: string; roster: Employee[] }) {
  const [members, setMembers] = useState<Member[]>(() =>
    crew.map((e) => ({
      employee: e,
      role: e.id === ownerId ? "Lead (Holder)" : e.department === "Field Safety" ? "Safety Officer" : "Support Tech",
    })),
  );
  const [selected, setSelected] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const available = roster.filter((e) => !members.some((m) => m.employee.id === e.id));

  function changeRole(id: string, value: string) {
    if (value === "Remove") {
      const member = members.find((m) => m.employee.id === id);
      if (member?.role === "Lead (Holder)") {
        setNotice("Assign another lead before removing the current holder.");
        return;
      }
      setMembers((list) => list.filter((m) => m.employee.id !== id));
      setNotice(`${member?.employee.name} removed from ticket.`);
      return;
    }
    const role = value as Role;
    setMembers((list) =>
      list.map((m) => {
        if (m.employee.id === id) return { ...m, role };
        // Only one lead/holder at a time.
        if (role === "Lead (Holder)" && m.role === "Lead (Holder)") return { ...m, role: "Support Tech" };
        return m;
      }),
    );
    setNotice(null);
  }

  function assign() {
    const employee = roster.find((e) => e.id === selected);
    if (!employee) return;
    setMembers((list) => [...list, { employee, role: "Support Tech" }]);
    setSelected("");
    setNotice(`${employee.name} assigned to ticket.`);
  }

  return (
    <section className="bg-white border border-slate-200 rounded p-5 flex flex-col gap-3.5 shadow-sm">
      <SideTitle
        icon="engineering"
        title="Assigned Crew & Technicians"
        right={
          <span className="text-[11px] font-label-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            {members.length} Assigned
          </span>
        }
      />
      {members.map(({ employee: e, role }) => (
        <div key={e.id} className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded border border-slate-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar
              employee={e}
              size={32}
              className="rounded border border-slate-300"
              fallbackClassName="bg-slate-800 text-white border border-slate-700"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 leading-tight truncate">{e.name}</span>
              <span className="text-[10px] font-label-mono text-slate-500 truncate">
                {e.id} • {e.title}
              </span>
            </div>
          </div>
          <select
            aria-label={`Role for ${e.name}`}
            className="form-select text-[10px] font-label-mono bg-white border border-slate-300 text-slate-700 rounded py-1 pl-1.5 pr-6 outline-none focus:border-safety-orange shrink-0"
            value={role}
            onChange={(ev) => changeRole(e.id, ev.target.value)}
          >
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
            <option>Remove</option>
          </select>
        </div>
      ))}
      {notice && (
        <p className="text-[11px] font-label-mono text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 flex items-center gap-1">
          <Icon name="info" className="text-xs text-safety-orange" /> {notice}
        </p>
      )}
      <div className="pt-1 border-t border-slate-100 flex flex-col gap-2">
        <label className="text-[11px] font-label-mono font-semibold text-slate-600" htmlFor="assign-employee">
          Change / Add Employee to Ticket:
        </label>
        <div className="flex gap-1.5">
          <select
            id="assign-employee"
            className="form-select w-full text-xs font-label-mono bg-slate-50 border border-slate-300 text-slate-800 rounded pl-2 pr-8 py-1.5 outline-none focus:border-safety-orange"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">-- Select Available Employee --</option>
            {available.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.title} - {employeeStatusLabel[e.status]})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={assign}
            disabled={!selected}
            className="bg-slate-dark hover:bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-label-mono font-bold flex items-center gap-1 transition-colors whitespace-nowrap disabled:opacity-60"
          >
            <Icon name="add" className="text-sm text-safety-orange" /> Assign
          </button>
        </div>
      </div>
    </section>
  );
}
