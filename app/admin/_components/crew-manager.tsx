"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { employeeStatusLabel } from "@/lib/format";
import type { Employee } from "@/lib/types";
import { addAdminTicketEmployee, passAdminTicket, removeAdminTicketEmployee } from "../actions";
import { SideTitle } from "./ui";

/** "Assigned Crew & Technicians" card: pass the ticket to another employee. */
export function CrewManager({ crew, ownerId, roster, ticketId }: { crew: Employee[]; ownerId: string; roster: Employee[]; ticketId: string }) {
  const [members, setMembers] = useState(crew);
  const [holderId, setHolderId] = useState(ownerId);
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [newEmployeeId, setNewEmployeeId] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();

  async function assign() {
    const employee = roster.find((e) => e.id === selected);
    if (!employee || employee.id === holderId) return;
    setSaving(true);
    const result = await passAdminTicket({ ticketId, toUserId: employee.id, note });
    setSaving(false);
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    setMembers((list) => [...list.filter((member) => member.id !== employee.id), employee]);
    setHolderId(employee.id);
    setSelected("");
    setNote("");
    setNotice(`Ticket passed to ${employee.name}.`);
  }

  async function addEmployee() {
    const employee = roster.find((candidate) => candidate.id === newEmployeeId);
    if (!employee) return;
    setAdding(true);
    const result = await addAdminTicketEmployee({ ticketId, userId: employee.id });
    setAdding(false);
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    setMembers((list) => [...list, employee]);
    setNewEmployeeId("");
    setNotice(`${employee.name} added to this ticket.`);
  }

  async function removeEmployee(employee: Employee) {
    if (removingId === employee.id) {
      setRemovingId(null);
      const result = await removeAdminTicketEmployee({ ticketId, userId: employee.id });
      if (!result.ok) {
        setNotice(result.error);
        return;
      }
      setMembers((list) => list.filter((member) => member.id !== employee.id));
      setNotice(`${employee.name} removed from this ticket.`);
      router.refresh();
      return;
    }
    setRemovingId(employee.id);
    setNotice(`Click Remove again to confirm removing ${employee.name}.`);
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
      {members.map((e) => (
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
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-label-mono font-bold uppercase ${e.id === holderId ? "text-safety-orange" : "text-slate-500"}`}>
              {e.id === holderId ? "Current holder" : "Assigned"}
            </span>
            <button
              type="button"
              onClick={() => void removeEmployee(e)}
              disabled={e.id === holderId || (removingId !== null && removingId !== e.id)}
              className="text-[10px] font-label-mono font-bold text-red-600 hover:text-red-800 disabled:text-slate-300 disabled:cursor-not-allowed"
            >
              {removingId === e.id ? "Confirm" : "Remove"}
            </button>
          </div>
        </div>
      ))}
      {notice && (
        <p className="text-[11px] font-label-mono text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 flex items-center gap-1">
          <Icon name="info" className="text-xs text-safety-orange" /> {notice}
        </p>
      )}
      <div className="pt-1 border-t border-slate-100 flex flex-col gap-2">
        <label className="text-[11px] font-label-mono font-semibold text-slate-600" htmlFor="assign-employee">
          Pass Ticket to Employee:
        </label>
        <div className="flex gap-1.5">
          <select
            id="assign-employee"
            className="form-select w-full text-xs font-label-mono bg-slate-50 border border-slate-300 text-slate-800 rounded pl-2 pr-8 py-1.5 outline-none focus:border-safety-orange"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">-- Select Employee --</option>
            {members.filter((e) => e.id !== holderId).map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.title} - {employeeStatusLabel[e.status]})
              </option>
            ))}
          </select>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional handover note"
            className="form-input w-full text-xs font-label-mono bg-slate-50 border border-slate-300 text-slate-800 rounded px-2 py-1.5 outline-none focus:border-safety-orange"
          />
          <button
            type="button"
            onClick={assign}
            disabled={!selected || saving}
            className="bg-slate-dark hover:bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-label-mono font-bold flex items-center gap-1 transition-colors whitespace-nowrap disabled:opacity-60"
          >
            <Icon name="swap_horiz" className="text-sm text-safety-orange" /> {saving ? "Passing..." : "Pass"}
          </button>
        </div>
      </div>
      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
        <label className="text-[11px] font-label-mono font-semibold text-slate-600" htmlFor="add-ticket-employee">
          Add Employee to Ticket:
        </label>
        <div className="flex gap-1.5">
          <select
            id="add-ticket-employee"
            className="form-select w-full text-xs font-label-mono bg-slate-50 border border-slate-300 text-slate-800 rounded pl-2 pr-8 py-1.5 outline-none focus:border-safety-orange"
            value={newEmployeeId}
            onChange={(e) => setNewEmployeeId(e.target.value)}
          >
            <option value="">-- Select Employee --</option>
            {roster.filter((e) => !members.some((member) => member.id === e.id)).map((e) => (
              <option key={e.id} value={e.id}>{e.name} ({e.title} - {employeeStatusLabel[e.status]})</option>
            ))}
          </select>
          <button
            type="button"
            onClick={addEmployee}
            disabled={!newEmployeeId || adding}
            className="bg-slate-dark hover:bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-label-mono font-bold flex items-center gap-1 transition-colors whitespace-nowrap disabled:opacity-60"
          >
            <Icon name="person_add" className="text-sm text-safety-orange" /> {adding ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </section>
  );
}
