"use client";

import Link from "next/link";
import { useState } from "react";
import { saveEmployeeTicketWorkspace, passEmployeeTicket } from "../actions";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import {
  employeeStatusLabel,
  formatDate,
  formatDateTime,
  phaseLabel,
  remainingLabel,
  subtaskProgress,
  ticketProgress,
} from "@/lib/format";
import type { ActivityEntry, Client, Employee, Subtask, Ticket } from "@/lib/types";
import { Card, CardHeader, PriorityBadge, ProgressBar, StatusBadge } from "./ui";

function nowIso() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

function localActivityId(ticketId: string) {
  return `${ticketId}-activity-${Date.now()}-${globalThis.crypto.randomUUID()}`;
}

const attachmentIcon: Record<Ticket["attachments"][number]["kind"], string> = {
  image: "image",
  pdf: "picture_as_pdf",
  log: "terminal",
  doc: "description",
  sheet: "table_chart",
};

export function TicketWorkspace({
  ticket,
  crew,
  client,
  me,
  customerLink,
}: {
  ticket: Ticket;
  crew: Employee[];
  client: Client;
  me: Employee;
  customerLink: string;
}) {
  const [subtasks, setSubtasks] = useState<Subtask[]>(ticket.subtasks);
  const [pendingSubtaskIds, setPendingSubtaskIds] = useState<string[]>([]);
  const [ownerId, setOwnerId] = useState(ticket.ownerId);
  const [activity, setActivity] = useState<ActivityEntry[]>(() => {
    const visible = ticket.activity.filter((entry) => entry.visibleToEmployees);
    return Array.from(new Map(visible.map((entry) => [entry.id, entry])).values());
  });
  const [adding, setAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", assigneeId: me.id, estimate: "" });
  const [passTo, setPassTo] = useState("");
  const [passNote, setPassNote] = useState("");
  const [update, setUpdate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activityExpanded, setActivityExpanded] = useState(false);
  const progress = ticketProgress({ subtasks });
  const doneCount = subtasks.filter((s) => s.status === "done").length;
  const isHolder = ownerId === me.id;
  const crewName = (id: string) => crew.find((c) => c.id === id)?.name ?? id;
  const owner = crew.find((c) => c.id === ownerId);

  async function persist(nextSubtasks: Subtask[], nextActivity: ActivityEntry[]) {
    setSaving(true);
    setError("");
    const result = await saveEmployeeTicketWorkspace({
      ticketId: ticket.id,
      subtasks: nextSubtasks,
      activities: nextActivity,
    });
    setSaving(false);
    if (!result.ok) setError(result.error);
  }

  async function toggleDone(id: string) {
    const target = subtasks.find((s) => s.id === id);
    if (!target) return;
    const markDone = target.status !== "done";

    // Add subtask to an array.
    const nextSubtasks: Subtask[] = subtasks.map((s) =>
        s.id === id
          ? markDone
            ? { ...s, status: "done" as const, progress: 100, completedAt: nowIso() }
            : { ...s, status: "in_progress" as const, progress: 50, completedAt: undefined }
          : s,
    );

    // This is a UI change. Imediately change the UI
    setSubtasks(nextSubtasks);

    // This creates the UI log array.
    const nextActivity = [...activity, {
      id: localActivityId(ticket.id),
      kind: "system" as const,
      authorId: me.id,
      authorName: "System Controller",
      authorRole: "Automation",
      at: nowIso(),
      text: `Subtask “${target.title}” ${markDone ? "marked as done" : "re-opened"} by ${me.name}.`,
      visibleToEmployees: true,
    }];
    setActivity(nextActivity);
    if (!pendingSubtaskIds.includes(id)) {
      await persist(nextSubtasks, nextActivity);
    }
  }

  function addSubtask() {
    if (!newTask.title.trim()) return;
    const id = `${ticket.id}-${globalThis.crypto.randomUUID()}`;
    setSubtasks((list) => [
      ...list,
      {
        id,
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        assigneeIds: [newTask.assigneeId],
        estimate: newTask.estimate || "—",
        status: "pending",
        progress: 0,
      },
    ]);
    setPendingSubtaskIds((ids) => [...ids, id]);
    setNewTask({ title: "", description: "", assigneeId: me.id, estimate: "" });
  }

  async function finishAddingSubtasks() {
    if (pendingSubtaskIds.length === 0) {
      setAdding(false);
      return;
    }
    setAdding(false);
    const nextActivity = [...activity, {
      id: localActivityId(ticket.id),
      kind: "system" as const,
      authorId: me.id,
      authorName: "System Controller",
      authorRole: "Automation",
      at: nowIso(),
      text: `Subtasks added by ${me.name}.`,
      visibleToEmployees: true,
    }];
    setActivity(nextActivity);
    await persist(subtasks, nextActivity);
    setPendingSubtaskIds([]);
  }

  async function passTicket() {
    if (!passTo) return;
    const to = crewName(passTo);
    setSaving(true);
    setError("");
    const result = await passEmployeeTicket({ ticketId: ticket.id, toUserId: passTo, note: passNote });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOwnerId(passTo);
    const nextActivity = [...activity, {
      id: localActivityId(ticket.id),
      kind: "employee" as const,
      authorId: me.id,
      authorName: me.name,
      authorRole: me.title,
      at: nowIso(),
      text: `Ticket passed from ${me.name} to ${to}.${passNote.trim() ? ` Handover note: ${passNote.trim()}` : ""}`,
      visibleToEmployees: true,
    }];
    setActivity(nextActivity);
    setPassTo("");
    setPassNote("");
  }

  async function postUpdate() {
    if (!update.trim()) return;
    const nextActivity = [...activity, {
      id: localActivityId(ticket.id),
      kind: "employee" as const,
      authorId: me.id,
      authorName: me.name,
      authorRole: me.title,
      at: nowIso(),
      text: update.trim(),
      visibleToEmployees: true,
    }];
    setActivity(nextActivity);
    setUpdate("");
    await persist(subtasks, nextActivity);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {error && <p className="lg:col-span-12 rounded border border-red-200 bg-red-50 p-3 text-xs text-error">{error}</p>}
      {saving && <p className="lg:col-span-12 text-xs font-label-mono text-on-surface-variant">Saving ticket changes…</p>}
      {/* ------------------------------------------------------- main column */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-label-mono font-bold uppercase tracking-wider text-slate-700">
            <Icon name="link" className="text-safety-orange text-base" />
            Customer share link
          </div>
          <a
            href={customerLink}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-safety-orange hover:underline break-all"
          >
            {customerLink}
          </a>
          <p className="text-xs text-slate-500">Send this unique URL to the customer for read-only job progress access.</p>
        </div>
        {/* Job progression strip */}
        <div className="bg-surface-container-lowest border border-slate-border rounded-lg shadow-sm overflow-hidden">
          <div className="bg-slate-dark text-white p-4 md:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[11px] font-label-mono font-bold bg-safety-orange text-white uppercase tracking-wider">
                  #{ticket.id}
                </span>
                <span className="font-label-mono text-[11px] text-slate-border">JOB {ticket.jobId}</span>
                <span className="font-label-mono text-[11px] text-slate-border">• {ticket.assetTag}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-label-mono text-slate-border">
                <span>Overall Completion:</span>
                <span className="text-safety-orange font-bold">{progress}%</span>
              </div>
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(subtasks.length, 1)}, minmax(0, 1fr))` }}>
              {subtasks.map((s, i) => {
                const pct = subtaskProgress(s);
                return (
                  <div key={s.id} className={`flex flex-col gap-1.5 ${s.status === "pending" ? "opacity-60" : ""}`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      {s.status === "done" ? (
                        <span className="w-5 h-5 rounded-full bg-industrial-green text-white flex items-center justify-center shrink-0">
                          <Icon name="check" className="text-[13px]" />
                        </span>
                      ) : (
                        <span
                          className={`w-5 h-5 rounded-full font-label-mono text-[10px] flex items-center justify-center font-bold shrink-0 ${
                            s.status === "in_progress"
                              ? "bg-safety-orange text-white"
                              : "bg-slate-700 border border-slate-border text-slate-border"
                          }`}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      )}
                      <span className="font-label-mono text-[11px] text-white font-medium truncate hidden sm:inline">{s.title}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s.status === "done" ? "bg-industrial-green" : "bg-safety-orange"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <dl className="p-5 md:px-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Meta label="Client" value={client.name} sub={client.facility} />
            <Meta label="Start Date" value={formatDate(ticket.startDate)} />
            <Meta label="End Date" value={formatDate(ticket.endDate)} sub={remainingLabel(ticket)} accent />
            <Meta label="Category" value={ticket.category} />
          </dl>
        </div>

        {/* Description */}
        <Card>
          <CardHeader icon="description" title="Description & Detailed Scope" />
          <p className="p-5 text-sm text-on-surface-variant leading-relaxed">{ticket.description}</p>
        </Card>

        {/* Subtasks */}
        <Card>
          <CardHeader
            icon="checklist"
            title="Milestone Breakdown & Subtasks"
            right={
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-label-mono font-semibold bg-slate-100 text-slate-dark border border-slate-border">
                  {doneCount}/{subtasks.length} Done
                </span>
                <button
                  type="button"
                  onClick={finishAddingSubtasks}
                  disabled={saving || pendingSubtaskIds.length === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-label-mono font-semibold border border-industrial-green text-industrial-green hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon name="check" className="text-sm" />
                  Done{pendingSubtaskIds.length > 0 ? ` (${pendingSubtaskIds.length})` : ""}
                </button>
              </div>
            }
          />
          <div className="p-4 md:p-5 flex flex-col gap-3">
            {subtasks.map((s, i) => {
              const done = s.status === "done";
              return (
                <div
                  key={s.id}
                  className={`border rounded-lg p-4 flex flex-col gap-3 transition-colors ${
                    done
                      ? "border-green-300 bg-green-50/50"
                      : s.status === "in_progress"
                        ? "border-orange-200 bg-orange-50/40"
                        : "border-slate-border bg-slate-surface"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded bg-slate-dark text-white font-label-mono text-xs flex items-center justify-center font-bold shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${done ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
                          {s.title}
                        </p>
                        {s.description && <p className="text-xs text-on-surface-variant mt-0.5">{s.description}</p>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleDone(s.id)}
                      className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-label-mono font-semibold border transition-colors ${
                        done
                          ? "border-green-300 bg-white text-industrial-green hover:bg-green-50"
                          : "border-safety-orange text-safety-orange hover:bg-orange-50/50"
                      }`}
                    >
                      <Icon name={done ? "undo" : "task_alt"} className="text-sm" />
                      {done ? "Undo" : "Mark Done"}
                    </button>
                  </div>
                  {s.status === "in_progress" && (
                    <div className="flex items-center gap-2">
                      <ProgressBar value={s.progress} />
                      <span className="text-[10px] font-label-mono font-bold text-safety-orange shrink-0">{s.progress}%</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-label-mono text-on-surface-variant pt-2 border-t border-slate-border/50">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-slate-dark font-medium">
                        <Icon name={s.assigneeIds.length > 1 ? "group" : "person"} className="text-xs text-safety-orange" />
                        Assigned: {s.assigneeIds.map(crewName).join(" & ")}
                      </span>
                      <span className="text-slate-border">|</span>
                      <span className="flex items-center gap-1">
                        <Icon name="timer" className="text-xs" /> Est: {s.estimate}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        done
                          ? "bg-green-50 text-industrial-green border-green-300"
                          : s.status === "in_progress"
                            ? "bg-amber-50 text-machinery-amber border-amber-300"
                            : "bg-slate-100 text-on-surface-variant border-slate-border"
                      }`}
                    >
                      {phaseLabel(i)} -{" "}
                      {done ? `Done ${s.completedAt ? formatDate(s.completedAt) : ""}` : s.status === "in_progress" ? "Active" : "Queued"}
                    </span>
                  </div>
                </div>
              );
            })}

            {adding ? (
              <div className="border border-safety-orange rounded-lg bg-white p-4 flex flex-col gap-3">
                <input
                  autoFocus
                  className="form-input w-full bg-white border border-slate-border rounded px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:border-safety-orange transition-colors"
                  placeholder="Subtask Title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <textarea
                  className="form-textarea w-full bg-white border border-slate-border rounded p-2.5 text-xs text-on-surface-variant focus:outline-none focus:border-safety-orange transition-colors"
                  placeholder="Subtask instructions and safety protocol..."
                  rows={2}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-label-mono">
                  <label className="flex items-center gap-1 text-slate-dark font-medium">
                    <Icon name="person" className="text-xs text-safety-orange" /> Assign:
                    <select
                      className="form-select bg-white border border-slate-border rounded py-0.5 pl-1.5 pr-7 text-[11px] font-label-mono focus:outline-none focus:border-safety-orange"
                      value={newTask.assigneeId}
                      onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                    >
                      {crew.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-1 text-on-surface-variant">
                    <Icon name="timer" className="text-xs" /> Est:
                    <input
                      className="form-input w-20 bg-white border border-slate-border rounded py-0.5 px-1.5 text-[11px] font-label-mono focus:outline-none focus:border-safety-orange"
                      placeholder="2 h"
                      value={newTask.estimate}
                      onChange={(e) => setNewTask({ ...newTask, estimate: e.target.value })}
                    />
                  </label>
                  <div className="flex gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setAdding(false)}
                      className="px-3 py-1.5 border border-slate-border rounded font-semibold text-on-surface-variant hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={addSubtask}
                      disabled={!newTask.title.trim()}
                      className="px-3 py-1.5 btn-safety rounded font-semibold text-white disabled:opacity-50"
                    >
                      Add Subtask
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                className="inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded text-xs font-label-mono font-semibold border border-dashed border-safety-orange text-safety-orange hover:bg-orange-50/50 transition-colors"
                type="button"
                onClick={() => setAdding(true)}
              >
                <Icon name="add_task" className="text-sm" />
                Add Subtask
              </button>
            )}
          </div>
        </Card>

        {/* Attachments */}
        <Card>
          <CardHeader
            icon="attach_file"
            title="Attachments"
            right={<span className="text-[10px] font-label-mono text-on-surface-variant">{ticket.attachments.length} Files</span>}
          />
          <div className="p-4 flex flex-wrap gap-3">
            {ticket.attachments.length === 0 && (
              <p className="text-xs text-on-surface-variant font-label-mono">No attachments on this ticket.</p>
            )}
            {ticket.attachments.map((a) => (
              <a
                key={a.id}
                href={`/api/attachments/${a.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 bg-slate-surface border border-slate-border rounded hover:border-safety-orange transition-all cursor-pointer group flex-1 min-w-[220px]"
              >
                <div className="bg-white border border-slate-border w-10 h-10 rounded flex items-center justify-center text-on-surface-variant group-hover:text-safety-orange transition-colors">
                  <Icon name={attachmentIcon[a.kind]} className="text-xl" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-label-mono font-bold text-on-surface group-hover:text-safety-orange transition-colors truncate">
                    {a.name}
                  </span>
                  <span className="text-[11px] font-label-mono text-on-surface-variant">
                    {a.size} • {a.label}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            icon="swap_horiz"
            title="Ticket Handover Notes"
            right={<span className="text-[10px] font-label-mono text-on-surface-variant">{ticket.handoverNotes?.length ?? 0} Handovers</span>}
          />
          <div className="p-4 flex flex-col gap-3">
            {(ticket.handoverNotes?.length ?? 0) === 0 && (
              <p className="text-xs text-on-surface-variant font-label-mono">No handover notes yet.</p>
            )}
            {ticket.handoverNotes?.map((handover) => (
              <div key={handover.id} className="border-l-4 border-l-safety-orange bg-orange-50/40 rounded p-3">
                <div className="flex flex-wrap justify-between gap-2 text-[11px] font-label-mono font-semibold text-slate-dark">
                  <span>{handover.fromName} → {handover.toName}</span>
                  <span className="text-on-surface-variant">{formatDateTime(handover.at)}</span>
                </div>
                {handover.note && <p className="mt-1 text-xs text-on-surface">{handover.note}</p>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ------------------------------------------------------ side column */}
      <aside className="lg:col-span-4 flex flex-col gap-5">
        {/* Ticket holder + pass ticket */}
        <div className="bg-surface-container-lowest border-2 border-safety-orange/40 rounded-lg shadow-sm p-4 flex flex-col gap-3">
          <div className="text-[11px] font-label-mono uppercase tracking-wider text-on-surface-variant font-bold flex items-center justify-between">
            <span>Ticket Holder</span>
            <span className="w-2 h-2 rounded-full bg-safety-orange animate-pulse" />
          </div>
          {owner && (
            <div className="flex items-center gap-2.5">
              <Avatar employee={owner} size={36} className="rounded border border-slate-border" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-on-surface leading-tight">
                  {owner.name} {isHolder && <span className="text-[10px] font-label-mono text-safety-orange">(You)</span>}
                </span>
                <span className="text-[10px] font-label-mono text-on-surface-variant">
                  {owner.id} • {owner.title}
                </span>
              </div>
            </div>
          )}
          {isHolder ? (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-border">
              <label className="text-[11px] font-label-mono font-semibold text-slate-dark" htmlFor="pass_to">
                Pass ticket to a crew member:
              </label>
              <select
                id="pass_to"
                className="form-select w-full text-xs font-label-mono bg-slate-surface border border-slate-border text-on-surface rounded pl-2 pr-8 py-1.5 focus:border-safety-orange focus:ring-0"
                value={passTo}
                onChange={(e) => setPassTo(e.target.value)}
              >
                <option value="">-- Select Crew Member --</option>
                {crew
                  .filter((c) => c.id !== ownerId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id}) — {employeeStatusLabel[c.status]}
                    </option>
                  ))}
              </select>
              <textarea
                className="form-textarea w-full text-xs bg-slate-surface border border-slate-border rounded p-2 focus:border-safety-orange focus:ring-0 resize-none"
                rows={2}
                placeholder="Handover note (optional)"
                value={passNote}
                onChange={(e) => setPassNote(e.target.value)}
              />
              <button
                type="button"
                onClick={passTicket}
                disabled={!passTo}
                className="w-full btn-safety text-white py-2.5 px-4 rounded text-xs font-label-mono font-bold tracking-wide uppercase shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Icon name="swap_horiz" className="text-base" /> Pass Ticket
              </button>
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant pt-2 border-t border-slate-border">
              Only the current holder can pass this ticket on. You can still update subtasks and post notes.
            </p>
          )}
          <Link
            href={`/employee/tickets/${ticket.id}/edit`}
            className="w-full border border-slate-border bg-slate-surface hover:bg-slate-100 text-slate-dark py-2 rounded text-xs font-label-mono font-semibold transition-colors flex items-center justify-center gap-1"
          >
            <Icon name="edit_note" className="text-sm" /> Update Ticket Details
          </Link>
        </div>

        <Card>
          <button
            type="button"
            onClick={() => setActivityExpanded((expanded) => !expanded)}
            aria-expanded={activityExpanded}
            className="w-full p-3.5 border-b border-slate-border bg-slate-surface flex items-center justify-between gap-2 text-left"
          >
            <span className="flex items-center gap-2">
              <Icon name="forum" className="text-on-surface-variant text-base" />
              <span className="font-headline-sm font-bold text-on-surface text-xs tracking-tight">
                Activity & Customer Care Notes
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="text-[10px] font-label-mono text-on-surface-variant">
                {activity.length} Entries
              </span>
              <Icon name={activityExpanded ? "expand_less" : "expand_more"} className="text-base text-on-surface-variant" />
            </span>
          </button>
          {activityExpanded && (
            <div className="p-4 flex flex-col gap-3">
              <span className="text-[10px] font-label-mono text-on-surface-variant">VISIBLE TO CREW</span>
              {activity.length === 0 && <p className="text-xs text-on-surface-variant font-label-mono">No activity yet.</p>}
              {activity.map((a) => (
                <div
                  key={a.id}
                  className={`rounded border p-3 text-xs ${
                    a.kind === "customer-care"
                      ? "border-orange-200 border-l-4 border-l-safety-orange bg-orange-50/40"
                      : a.kind === "system"
                        ? "border-slate-border bg-slate-surface"
                        : "border-slate-border bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-label-mono font-bold text-slate-dark flex items-center gap-1.5 uppercase text-[11px]">
                      <Icon
                        name={a.kind === "customer-care" ? "support_agent" : a.kind === "system" ? "memory" : "engineering"}
                        className="text-xs text-safety-orange"
                      />
                      {a.authorName}
                      <span className="font-normal normal-case text-on-surface-variant">[{a.authorRole}]</span>
                      {a.kind === "customer-care" && (
                        <span className="px-1.5 py-0.5 rounded bg-safety-orange text-white text-[9px] font-bold">CARE NOTE</span>
                      )}
                    </span>
                    <span className="text-[10px] font-label-mono text-on-surface-variant shrink-0">{formatDate(a.at)}</span>
                  </div>
                  <p className="text-on-surface leading-relaxed">{a.text}</p>
                </div>
              ))}
              <div className="pt-3 border-t border-slate-border flex flex-col gap-2">
                <div className="relative custom-focus-ring rounded">
                  <textarea
                    className="form-textarea w-full border border-slate-border rounded p-3 text-xs bg-slate-surface text-on-surface placeholder:text-outline focus:ring-0 focus:outline-none resize-none"
                    placeholder="Post a field update for the crew and customer care..."
                    rows={2}
                    value={update}
                    onChange={(e) => setUpdate(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={postUpdate}
                  disabled={!update.trim()}
                  className="self-end inline-flex items-center gap-1.5 px-4 py-2 bg-slate-dark hover:bg-slate-800 text-white rounded text-xs font-label-mono font-bold transition-colors disabled:opacity-50"
                >
                  <Icon name="send" className="text-sm text-safety-orange" />
                  Post Update
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Crew */}
        <Card>
          <CardHeader
            icon="engineering"
            title="Participating Crew"
            right={<span className="text-[10px] font-label-mono text-on-surface-variant">{crew.length} Assigned</span>}
          />
          <ul className="divide-y divide-slate-border">
            {crew.map((c) => (
              <li key={c.id} className="p-3 flex items-center gap-2.5">
                <Avatar employee={c} size={32} className="rounded border border-slate-border" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-on-surface truncate">{c.name}</span>
                  <span className="text-[10px] font-label-mono text-on-surface-variant truncate">
                    {c.id} • {c.title}
                  </span>
                </div>
                {c.id === ownerId ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-label-mono font-bold bg-safety-orange text-white uppercase">
                    Holder
                  </span>
                ) : (
                  <span className="text-[10px] font-label-mono text-industrial-green font-semibold">
                    {employeeStatusLabel[c.status]}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card>

        {/* Properties */}
        <Card>
          <CardHeader icon="tune" title="Ticket Properties" />
          <dl className="p-4 flex flex-col gap-3 text-xs">
            <Prop label="STATUS">
              <StatusBadge status={progress === 100 && ticket.status !== "completed" ? "awaiting_signoff" : ticket.status} />
            </Prop>
            <Prop label="PRIORITY">
              <PriorityBadge priority={ticket.priority} />
            </Prop>
            <Prop label="PROGRESS">
              <span className="font-label-mono font-bold text-slate-dark">{progress}%</span>
            </Prop>
            <Prop label="CREATED BY">
              <span className="font-label-mono text-slate-dark font-semibold">{crewName(ticket.createdById)}</span>
            </Prop>
            <Prop label="LAST UPDATE" last>
              <span className="font-label-mono text-slate-dark font-semibold">{formatDate(ticket.updatedAt)}</span>
            </Prop>
          </dl>
        </Card>
      </aside>
    </div>
  );
}

function Meta({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <dt className="text-[10px] font-label-mono uppercase text-on-surface-variant font-semibold">{label}</dt>
      <dd className="text-sm font-bold text-on-surface truncate">{value}</dd>
      {sub && (
        <dd className={`text-[11px] font-label-mono truncate ${accent ? "text-safety-orange font-semibold" : "text-on-surface-variant"}`}>
          {sub}
        </dd>
      )}
    </div>
  );
}

function Prop({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex justify-between items-center pb-2 ${last ? "" : "border-b border-slate-border/60"}`}>
      <dt className="text-on-surface-variant font-label-mono">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
