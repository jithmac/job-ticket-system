"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignAdminSubtask } from "../actions";
import type { Employee, Subtask } from "@/lib/types";

export function SubtaskAssignment({ ticketId, subtasks, employees }: { ticketId: string; subtasks: Subtask[]; employees: Employee[] }) {
  const [assignments, setAssignments] = useState(() => new Map(subtasks.map((subtask) => [subtask.id, subtask.assigneeIds[0] ?? ""])));
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingAssignee, setPendingAssignee] = useState(subtasks[0]?.assigneeIds[0] ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const [selectedSubtaskId, setSelectedSubtaskId] = useState(subtasks[0]?.id ?? "");
  const selectedSubtask = subtasks.find((subtask) => subtask.id === selectedSubtaskId);
  const selectedAssignee = selectedSubtask ? assignments.get(selectedSubtask.id) ?? "" : "";

  async function confirmAssignment() {
    if (!selectedSubtask) return;
    setSaving(true);
    const result = await assignAdminSubtask({ ticketId, subtaskId: selectedSubtask.id, userId: pendingAssignee });
    setSaving(false);
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    setAssignments((current) => new Map(current).set(selectedSubtask.id, pendingAssignee));
    setNotice("Subtask assignment saved.");
    router.refresh();
  }

  return (
    <section className="bg-white border border-slate-200 rounded p-5 flex flex-col gap-3 shadow-sm">
      <div className="border-b border-slate-100 pb-2">
        <h3 className="text-xs font-label-mono uppercase tracking-wider text-slate-800 font-bold">Subtask Assignment</h3>
        <p className="text-[11px] text-slate-500 mt-1">Assign each phase to the employee responsible for completing it.</p>
      </div>
      <label className="flex flex-col gap-1 text-[11px] font-label-mono font-semibold text-slate-600">
        Subtask
        <select
          value={selectedSubtaskId}
          onChange={(event) => {
            const subtaskId = event.target.value;
            setSelectedSubtaskId(subtaskId);
            setPendingAssignee(assignments.get(subtaskId) ?? "");
          }}
          className="form-select w-full text-xs font-label-mono bg-slate-50 border border-slate-300 text-slate-700 rounded py-1.5 pl-2 pr-6 outline-none focus:border-safety-orange"
        >
          {subtasks.map((subtask) => <option key={subtask.id} value={subtask.id}>{subtask.title}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[11px] font-label-mono font-semibold text-slate-600">
        Employee
        <select
          value={pendingAssignee}
          onChange={(event) => setPendingAssignee(event.target.value)}
          className="form-select w-full text-xs font-label-mono bg-slate-50 border border-slate-300 text-slate-700 rounded py-1.5 pl-2 pr-6 outline-none focus:border-safety-orange"
        >
          <option value="">Unassigned</option>
          {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
        </select>
      </label>
      <button
        type="button"
        onClick={() => void confirmAssignment()}
        disabled={!selectedSubtask || pendingAssignee === selectedAssignee || saving}
        className="bg-slate-dark hover:bg-slate-800 text-white py-2 rounded text-xs font-label-mono font-bold disabled:opacity-50"
      >
        {saving ? "Saving..." : "Confirm Assignment"}
      </button>
      {notice && <p className="text-[11px] font-label-mono text-slate-600">{notice}</p>}
    </section>
  );
}
