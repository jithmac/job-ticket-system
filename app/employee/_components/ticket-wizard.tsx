"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { employeeStatusLabel, priorityLabel, priorityOrder } from "@/lib/format";
import type { Client, Employee, Priority } from "@/lib/types";
import { Card, CardHeader, FieldLabel } from "./ui";

/* ------------------------------------------------------------------ types */

// These are interfaces
// Define the structure of the data
export interface DraftSubtask {
  key: string;
  title: string;
  description: string;
  assigneeId: string;
  estimate: string;
}

export interface DraftAttachment {
  key: string;
  name: string;
  size: string;
}

export interface TicketDraft {
  title: string;
  clientId: string;
  category: string;
  priority: Priority;
  startDate: string;
  endDate: string;
  description: string;
  subtasks: DraftSubtask[];
  participantIds: string[];
  attachments: DraftAttachment[];
}

interface Check {
  label: string;
  ok: boolean;
}

/* ------------------------------------------------------------------ steps */

const STEPS = [
  {
    short: "General Info",
    title: "General Information",
    icon: "assignment",
    heading: "Job Identification & Schedule",
    blurb: "Identify the job, the client it is for, how urgent it is and the scheduled work window.",
  },
  {
    short: "Scope & Tasks",
    title: "Scope & Subtasks",
    icon: "rule",
    heading: "Work Scope & Milestone Breakdown",
    blurb: "Define technical diagnostic scope, safe work guidelines, and specific procedural milestones for field deployment.",
  },
  {
    short: "Personnel",
    title: "Personnel & Attachments",
    icon: "engineering",
    heading: "Crew Assignment & Supporting Files",
    blurb: "Select the employees who will participate in this job and attach drawings, photos or logs.",
  },
  {
    short: "Review & Dispatch",
    title: "Review & Dispatch",
    icon: "fact_check",
    heading: "Final Review Before Dispatch",
    blurb: "Confirm every detail is correct. The ticket is sent to the crew and customer care once dispatched.",
  },
] as const;

function stepChecks(draft: TicketDraft, confirmed: boolean): Check[][] {
  return [
    [
      { label: "Job title entered", ok: draft.title.trim().length >= 5 },
      { label: "Client selected", ok: draft.clientId !== "" },
      { label: "Category selected", ok: draft.category !== "" },
      { label: "Start date set", ok: draft.startDate !== "" },
      { label: "End date set", ok: draft.endDate !== "" },
      {
        label: "End date after start date",
        ok: draft.startDate !== "" && draft.endDate !== "" && draft.endDate >= draft.startDate,
      },
    ],
    [
      { label: "Description (20+ characters)", ok: draft.description.trim().length >= 20 },
      { label: "At least one subtask", ok: draft.subtasks.length > 0 },
      { label: "Every subtask has a title", ok: draft.subtasks.every((s) => s.title.trim() !== "") },
    ],
    [
      { label: "At least one participating employee", ok: draft.participantIds.length > 0 },
      { label: "At least one attachment", ok: draft.attachments.length > 0 },
    ],
    [{ label: "Details confirmed by ticket owner", ok: confirmed }],
  ];
}

/* ------------------------------------------------------------- utilities */
// utilities are the helper code created for commolly used codes.
// They are typically simple functions that perform a specific task.

const inputCls =
  "form-input w-full border border-slate-border rounded px-3 py-2.5 text-sm bg-slate-surface text-on-surface placeholder:text-outline focus:ring-0 focus:outline-none transition-colors font-body-md";
const selectCls =
  "form-select w-full border border-slate-border rounded pl-3 pr-10 py-2.5 text-sm bg-slate-surface text-on-surface focus:ring-0 focus:outline-none transition-colors font-body-md";

const priorityTone: Record<Priority, string> = {
  low: "border-slate-400 bg-slate-100 text-slate-dark",
  medium: "border-machinery-amber bg-amber-50 text-machinery-amber",
  high: "border-safety-orange bg-orange-50 text-safety-orange",
  critical: "border-error bg-red-50 text-error",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ErrorText({ show, children }: { show: boolean; children: ReactNode }) {
  if (!show) return null;
  return (
    <p className="text-[11px] text-error font-label-mono flex items-center gap-1 mt-0.5">
      <Icon name="error" className="text-xs" /> {children}
    </p>
  );
}

/* -------------------------------------------------------------- component */

export function TicketWizard({
  mode,
  ticketId,
  owner,
  employees,
  clients,
  categories,
  initial,
  sidebar,
}: {
  mode: "create" | "edit";
  /** Existing ticket id (edit) or the id that will be issued (create). */
  ticketId: string;
  owner: Employee;
  employees: Employee[];
  clients: Client[];
  categories: readonly string[];
  initial: TicketDraft;
  sidebar?: ReactNode;
}) {
  const [draft, setDraft] = useState<TicketDraft>(initial);
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(mode === "edit" ? STEPS.length - 1 : 0);
  const [showErrors, setShowErrors] = useState<boolean[]>([false, false, false, false]);
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [crewQuery, setCrewQuery] = useState("");
  const keySeq = useRef(100);
  const fileInput = useRef<HTMLInputElement>(null);

  const checks = stepChecks(draft, confirmed);
  const stepValid = (i: number) => checks[i].every((c) => c.ok);
  const errorsOn = showErrors[step];
  const completion = Math.round(((step + 1) / STEPS.length) * 100);
  const others = employees.filter((e) => e.id !== owner.id);

  function update<K extends keyof TicketDraft>(key: K, value: TicketDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function updateSubtask(key: string, patch: Partial<DraftSubtask>) {
    setDraft((d) => ({ ...d, subtasks: d.subtasks.map((s) => (s.key === key ? { ...s, ...patch } : s)) }));
  }

  function addSubtask() {
    keySeq.current += 1;
    setDraft((d) => ({
      ...d,
      subtasks: [
        ...d.subtasks,
        { key: `new-${keySeq.current}`, title: "", description: "", assigneeId: owner.id, estimate: "" },
      ],
    }));
  }

  function removeSubtask(key: string) {
    setDraft((d) => ({ ...d, subtasks: d.subtasks.filter((s) => s.key !== key) }));
  }

  function toggleParticipant(id: string) {
    setDraft((d) => ({
      ...d,
      participantIds: d.participantIds.includes(id)
        ? d.participantIds.filter((p) => p !== id)
        : [...d.participantIds, id],
    }));
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const added = Array.from(files).map((f) => {
      keySeq.current += 1;
      return { key: `file-${keySeq.current}`, name: f.name, size: formatBytes(f.size) };
    });
    setDraft((d) => ({ ...d, attachments: [...d.attachments, ...added] }));
  }

  function goTo(target: number) {
    if (target <= maxReached) setStep(target);
  }

  function next() {
    if (!stepValid(step)) {
      setShowErrors((s) => s.map((v, i) => (i === step ? true : v)));
      return;
    }
    if (step === 1) {
      // Anyone assigned to a subtask participates in the job.
      setDraft((d) => {
        const assignees = d.subtasks.map((s) => s.assigneeId).filter((id) => id !== owner.id);
        return { ...d, participantIds: Array.from(new Set([...d.participantIds, ...assignees])) };
      });
    }
    const target = step + 1;
    setStep(target);
    setMaxReached((m) => Math.max(m, target));
  }

  function submit() {
    if (!stepValid(3)) {
      setShowErrors((s) => s.map((v, i) => (i === 3 ? true : v)));
      return;
    }
    // TODO: persist through a Server Action / API route once the backend exists.
    setSubmitted(true);
  }

  function saveDraft() {
    const now = new Date();
    setDraftSavedAt(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
  }

  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? "—";
  const employeeName = (id: string) => employees.find((e) => e.id === id)?.name ?? "—";

  if (submitted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Card className="lg:col-span-8">
          <div className="bg-slate-dark text-white p-4 md:px-6 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-label-mono font-bold bg-industrial-green text-white uppercase tracking-wider">
              {mode === "create" ? "Dispatched" : "Updated"}
            </span>
            <span className="font-headline-sm font-semibold text-sm text-white">#{ticketId}</span>
          </div>
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <span className="w-14 h-14 rounded-full bg-green-50 border border-green-300 flex items-center justify-center">
              <Icon name="task_alt" className="text-industrial-green text-3xl" />
            </span>
            <div>
              <h3 className="font-headline-md font-bold text-xl text-on-surface">
                {mode === "create" ? "Ticket created and dispatched" : "Ticket changes saved"}
              </h3>
              <p className="text-sm text-on-surface-variant mt-1 max-w-md">
                <span className="font-semibold text-on-surface">{draft.title}</span> for {clientName(draft.clientId)} is
                now visible to {draft.participantIds.length} crew member{draft.participantIds.length === 1 ? "" : "s"} and
                customer care.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Link
                href={mode === "edit" ? `/employee/tickets/${ticketId}` : "/employee/tickets"}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 btn-safety rounded font-label-mono text-xs uppercase tracking-wider font-semibold text-white shadow hover:shadow-md transition-all"
              >
                {mode === "edit" ? "Back to ticket" : "View my tickets"}
                <Icon name="arrow_forward" className="text-base" />
              </Link>
              {mode === "create" && (
                <button
                  type="button"
                  onClick={() => {
                    setDraft(initial);
                    setStep(0);
                    setMaxReached(0);
                    setConfirmed(false);
                    setShowErrors([false, false, false, false]);
                    setSubmitted(false);
                  }}
                  className="px-4 py-2.5 border border-slate-border rounded font-label-mono text-xs uppercase tracking-wider font-semibold text-on-surface-variant hover:bg-slate-100 transition-colors"
                >
                  Create another ticket
                </button>
              )}
            </div>
          </div>
        </Card>
        <aside className="flex flex-col gap-5 lg:col-span-4">{sidebar}</aside>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Form Wizard Main Card (Step-by-step workflow) */}
      <div className="bg-surface-container-lowest border border-slate-border rounded-lg shadow-sm lg:col-span-8 overflow-hidden">
        {/* Technical Stepper Bar */}
        <div className="bg-slate-dark text-white p-4 md:px-6 border-b border-slate-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-label-mono font-bold bg-safety-orange text-white uppercase tracking-wider">
                Step {step + 1} of {STEPS.length}
              </span>
              <span className="font-headline-sm font-semibold text-sm text-white">{STEPS[step].title}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-label-mono text-slate-border">
              <span>Overall Completion:</span>
              <span className="text-safety-orange font-bold">{completion}%</span>
            </div>
          </div>
          {/* Stepper Progression Track */}
          <div className="grid grid-cols-4 gap-2">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              const reachable = i <= maxReached;
              return (
                <button
                  key={s.short}
                  type="button"
                  onClick={() => goTo(i)}
                  disabled={!reachable}
                  className={`flex flex-col gap-1.5 text-left group disabled:cursor-not-allowed ${
                    !done && !active ? "opacity-60 hover:opacity-100 transition-opacity" : ""
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {done ? (
                      <span className="w-5 h-5 rounded-full bg-industrial-green text-white font-label-mono text-[10px] flex items-center justify-center font-bold">
                        <Icon name="check" className="text-[13px]" />
                      </span>
                    ) : (
                      <span
                        className={`w-5 h-5 rounded-full font-label-mono text-[10px] flex items-center justify-center font-bold ${
                          active
                            ? "bg-safety-orange text-white"
                            : "bg-slate-700 border border-slate-border text-slate-border"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    )}
                    <span
                      className={`font-label-mono text-[11px] truncate hidden sm:inline ${
                        active ? "text-white font-semibold" : done ? "text-white font-medium" : "text-slate-border"
                      }`}
                    >
                      {i + 1}. {s.short}
                    </span>
                  </div>
                  <div
                    className={`w-full h-1 rounded-full ${
                      done ? "bg-industrial-green" : active ? "bg-safety-orange" : "bg-slate-700"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Work-Area Content */}
        <form className="p-6 md:p-8 flex flex-col gap-6" onSubmit={(e) => e.preventDefault()} noValidate>
          {/* Step Header Intro Banner */}
          <div className="bg-slate-surface border border-slate-border rounded-lg p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Icon name={STEPS[step].icon} className="text-safety-orange text-2xl mt-0.5" />
              <div className="flex flex-col">
                <h3 className="font-headline-sm font-bold text-on-surface text-base">{STEPS[step].heading}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{STEPS[step].blurb}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-label-mono font-semibold bg-orange-50 text-safety-orange border border-orange-200 shrink-0 hidden sm:inline-block">
              Phase {step + 1} Active
            </span>
          </div>

          {/* ---------------------------------------------- STEP 1: General */}
          {step === 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel icon="badge" hint="AUTO-FILLED">
                    Employee Name
                  </FieldLabel>
                  <div className="flex items-center gap-2 border border-slate-border rounded px-3 py-2.5 text-sm bg-slate-100 text-on-surface-variant">
                    <Icon name="lock" className="text-sm text-outline" />
                    {owner.name}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel icon="fingerprint" hint="AUTO-FILLED">
                    Employee ID
                  </FieldLabel>
                  <div className="flex items-center gap-2 border border-slate-border rounded px-3 py-2.5 text-sm bg-slate-100 text-on-surface-variant font-label-mono">
                    <Icon name="lock" className="text-sm text-outline" />
                    {owner.id}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="job_title" icon="title" required hint="SHOWN TO CLIENT">
                  Job Title
                </FieldLabel>
                <div className="relative custom-focus-ring rounded">
                  <input
                    id="job_title"
                    className={inputCls}
                    placeholder="e.g. High-Pressure Turbine Calibration & Vibration Dampening"
                    value={draft.title}
                    onChange={(e) => update("title", e.target.value)}
                  />
                </div>
                <ErrorText show={errorsOn && !checks[0][0].ok}>Enter a job title (at least 5 characters).</ErrorText>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel htmlFor="client" icon="corporate_fare" required>
                    Client
                  </FieldLabel>
                  <div className="relative custom-focus-ring rounded">
                    <select
                      id="client"
                      className={selectCls}
                      value={draft.clientId}
                      onChange={(e) => update("clientId", e.target.value)}
                    >
                      <option value="">-- Select Client --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <ErrorText show={errorsOn && !checks[0][1].ok}>Select the client for this job.</ErrorText>
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel htmlFor="category" icon="category" required>
                    Category
                  </FieldLabel>
                  <div className="relative custom-focus-ring rounded">
                    <select
                      id="category"
                      className={selectCls}
                      value={draft.category}
                      onChange={(e) => update("category", e.target.value)}
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <ErrorText show={errorsOn && !checks[0][2].ok}>Select a category.</ErrorText>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel icon="priority_high" required hint="SLA IMPACT">
                  Priority Level
                </FieldLabel>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="radiogroup" aria-label="Priority level">
                  {priorityOrder.map((p) => {
                    const selected = draft.priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => update("priority", p)}
                        className={`px-3 py-2.5 rounded border font-label-mono text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                          selected
                            ? priorityTone[p]
                            : "border-slate-border bg-slate-surface text-on-surface-variant hover:border-slate-400"
                        }`}
                      >
                        {selected && <Icon name="radio_button_checked" className="text-sm" />}
                        {priorityLabel[p]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <FieldLabel htmlFor="start_date" icon="event" required>
                    Start Date
                  </FieldLabel>
                  <div className="relative custom-focus-ring rounded">
                    <input
                      id="start_date"
                      type="date"
                      className={inputCls}
                      value={draft.startDate}
                      onChange={(e) => update("startDate", e.target.value)}
                    />
                  </div>
                  <ErrorText show={errorsOn && !checks[0][3].ok}>Pick a start date.</ErrorText>
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldLabel htmlFor="end_date" icon="event_available" required>
                    End Date
                  </FieldLabel>
                  <div className="relative custom-focus-ring rounded">
                    <input
                      id="end_date"
                      type="date"
                      className={inputCls}
                      min={draft.startDate || undefined}
                      value={draft.endDate}
                      onChange={(e) => update("endDate", e.target.value)}
                    />
                  </div>
                  <ErrorText show={errorsOn && (!checks[0][4].ok || !checks[0][5].ok)}>
                    Pick an end date on or after the start date.
                  </ErrorText>
                </div>
              </div>
            </>
          )}

          {/* ------------------------------------------ STEP 2: Scope & Tasks */}
          {step === 1 && (
            <>
              <div className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="ticket_description" icon="description" required hint="TELEMETRY & SCOPE SPEC">
                  Description &amp; Detailed Scope
                </FieldLabel>
                <div className="relative custom-focus-ring rounded">
                  <textarea
                    id="ticket_description"
                    className="form-textarea w-full border border-slate-border rounded p-3 bg-slate-surface text-on-surface placeholder:text-outline focus:ring-0 focus:outline-none transition-colors resize-y font-body-md"
                    placeholder="Provide technical diagnostic summary, telemetry thresholds, equipment IDs, hazard clearances, and physical site requirements..."
                    rows={4}
                    value={draft.description}
                    onChange={(e) => update("description", e.target.value)}
                  />
                </div>
                {errorsOn && !checks[1][0].ok ? (
                  <ErrorText show>Describe the job in at least 20 characters.</ErrorText>
                ) : (
                  <p className="text-[11px] text-on-surface-variant font-label-mono flex items-center gap-1 mt-0.5">
                    <Icon name="info" className="text-xs text-industrial-green" /> Included in field telemetry report
                    dispatched to technicians.
                  </p>
                )}
              </div>

              {/* Subtasks & Milestone Tracking Section */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-border pb-2.5 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-label-mono text-xs uppercase tracking-wider font-semibold text-slate-dark flex items-center gap-1">
                      <Icon name="checklist" className="text-sm text-safety-orange" />
                      <span>Milestone Breakdown &amp; Subtasks</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-label-mono font-semibold bg-slate-100 text-slate-dark border border-slate-border">
                      {draft.subtasks.length} Configured
                    </span>
                  </div>
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-label-mono font-semibold border border-safety-orange text-safety-orange hover:bg-orange-50/50 transition-colors shrink-0"
                    type="button"
                    onClick={addSubtask}
                  >
                    <Icon name="add_task" className="text-sm" />
                    <span>Add Subtask</span>
                  </button>
                </div>
                <ErrorText show={errorsOn && (!checks[1][1].ok || !checks[1][2].ok)}>
                  Add at least one subtask and give every subtask a title.
                </ErrorText>

                <div className="space-y-3">
                  {draft.subtasks.length === 0 && (
                    <div className="border border-dashed border-slate-border rounded-lg p-6 text-center text-xs text-on-surface-variant font-label-mono">
                      No subtasks yet — use “Add Subtask” to break the job into milestones.
                    </div>
                  )}
                  {draft.subtasks.map((s, i) => (
                    <div
                      key={s.key}
                      className="border border-slate-border rounded-lg bg-slate-surface p-4 flex flex-col gap-3 relative group hover:border-slate-400 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-6 h-6 rounded bg-slate-dark text-white font-label-mono text-xs flex items-center justify-center font-bold shrink-0">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <input
                            className="form-input w-full bg-white border border-slate-border rounded px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:border-safety-orange transition-colors"
                            placeholder="Subtask Title"
                            aria-label={`Subtask ${i + 1} title`}
                            value={s.title}
                            onChange={(e) => updateSubtask(s.key, { title: e.target.value })}
                          />
                        </div>
                        <button
                          className="text-on-surface-variant hover:text-error transition-colors p-1"
                          title="Remove subtask"
                          type="button"
                          onClick={() => removeSubtask(s.key)}
                        >
                          <Icon name="close" className="text-base" />
                        </button>
                      </div>
                      <textarea
                        className="form-textarea w-full bg-white border border-slate-border rounded p-2.5 text-xs text-on-surface-variant focus:outline-none focus:border-safety-orange transition-colors font-body-md"
                        placeholder="Subtask instructions and safety protocol..."
                        aria-label={`Subtask ${i + 1} instructions`}
                        rows={2}
                        value={s.description}
                        onChange={(e) => updateSubtask(s.key, { description: e.target.value })}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-label-mono text-on-surface-variant pt-2 border-t border-slate-border/50">
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="flex items-center gap-1 text-slate-dark font-medium">
                            <Icon name="person" className="text-xs text-safety-orange" /> Assigned:
                            <select
                              className="form-select bg-white border border-slate-border rounded py-0.5 pl-1.5 pr-7 text-[11px] font-label-mono focus:outline-none focus:border-safety-orange"
                              value={s.assigneeId}
                              onChange={(e) => updateSubtask(s.key, { assigneeId: e.target.value })}
                            >
                              {employees.map((e) => (
                                <option key={e.id} value={e.id}>
                                  {e.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <span className="text-slate-border">|</span>
                          <label className="flex items-center gap-1 text-on-surface-variant">
                            <Icon name="timer" className="text-xs" /> Est:
                            <input
                              className="form-input w-20 bg-white border border-slate-border rounded py-0.5 px-1.5 text-[11px] font-label-mono focus:outline-none focus:border-safety-orange"
                              placeholder="45 min"
                              value={s.estimate}
                              onChange={(e) => updateSubtask(s.key, { estimate: e.target.value })}
                            />
                          </label>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            i === 0
                              ? "bg-amber-50 text-machinery-amber border-amber-300"
                              : "bg-slate-100 text-on-surface-variant border-slate-border"
                          }`}
                        >
                          Phase {i + 1} - {i === 0 ? "Pending" : "Queued"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* --------------------------------------- STEP 3: Personnel & Files */}
          {step === 2 && (
            <>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-border pb-2.5 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-label-mono text-xs uppercase tracking-wider font-semibold text-slate-dark flex items-center gap-1">
                      <Icon name="group" className="text-sm text-safety-orange" />
                      Participating Employees <span className="text-safety-orange font-bold">*</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-label-mono font-semibold bg-slate-100 text-slate-dark border border-slate-border">
                      {draft.participantIds.length} Selected
                    </span>
                  </div>
                  <div className="relative custom-focus-ring rounded sm:w-56">
                    <Icon name="search" className="absolute left-2.5 top-2 text-sm text-outline" />
                    <input
                      className="form-input w-full border border-slate-border rounded pl-8 pr-3 py-1.5 text-xs bg-slate-surface placeholder:text-outline focus:ring-0 focus:outline-none font-label-mono"
                      placeholder="Filter by name or ID"
                      value={crewQuery}
                      onChange={(e) => setCrewQuery(e.target.value)}
                    />
                  </div>
                </div>
                <ErrorText show={errorsOn && !checks[2][0].ok}>Select at least one employee to participate.</ErrorText>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Ticket owner is always on the crew */}
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-dark bg-slate-dark text-white">
                    <Avatar employee={owner} size={36} className="rounded border border-slate-600" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold truncate">{owner.name}</span>
                      <span className="text-[10px] font-label-mono text-slate-border truncate">
                        {owner.id} • {owner.title}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-label-mono font-bold bg-safety-orange text-white uppercase">
                      Owner
                    </span>
                  </div>
                  {others
                    .filter((e) => `${e.name} ${e.id} ${e.title}`.toLowerCase().includes(crewQuery.toLowerCase()))
                    .map((e) => {
                      const selected = draft.participantIds.includes(e.id);
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => toggleParticipant(e.id)}
                          aria-pressed={selected}
                          className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                            selected
                              ? "border-safety-orange bg-orange-50/60"
                              : "border-slate-border bg-slate-surface hover:border-slate-400"
                          }`}
                        >
                          <Avatar employee={e} size={36} className="rounded border border-slate-border" />
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-bold text-on-surface truncate">{e.name}</span>
                            <span className="text-[10px] font-label-mono text-on-surface-variant truncate">
                              {e.id} • {e.title}
                            </span>
                            <span
                              className={`text-[10px] font-label-mono font-semibold ${
                                e.status === "off_duty" ? "text-outline" : "text-industrial-green"
                              }`}
                            >
                              {employeeStatusLabel[e.status]}
                            </span>
                          </div>
                          <Icon
                            name={selected ? "check_box" : "check_box_outline_blank"}
                            className={selected ? "text-safety-orange" : "text-outline"}
                            fill={selected}
                          />
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Attachments */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-border pb-2.5">
                  <span className="font-label-mono text-xs uppercase tracking-wider font-semibold text-slate-dark flex items-center gap-1">
                    <Icon name="attach_file" className="text-sm text-safety-orange" />
                    Attachments <span className="text-safety-orange font-bold">*</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-label-mono font-semibold bg-slate-100 text-slate-dark border border-slate-border">
                    {draft.attachments.length} Files
                  </span>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInput.current?.click()}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInput.current?.click()}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    addFiles(e.dataTransfer.files);
                  }}
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-2 text-center cursor-pointer transition-colors ${
                    dragging ? "border-safety-orange bg-orange-50/50" : "border-slate-border bg-slate-surface hover:border-slate-400"
                  }`}
                >
                  <Icon name="cloud_upload" className="text-3xl text-safety-orange" />
                  <p className="text-sm font-semibold text-on-surface">Drag &amp; drop files or click to browse</p>
                  <p className="text-[11px] font-label-mono text-on-surface-variant">
                    PNG, JPG, PDF, CSV, TXT • Max 25 MB per file
                  </p>
                  <input
                    ref={fileInput}
                    id="file_upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>
                <ErrorText show={errorsOn && !checks[2][1].ok}>Attach at least one supporting file.</ErrorText>
                {draft.attachments.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {draft.attachments.map((a) => (
                      <li
                        key={a.key}
                        className="flex items-center justify-between gap-3 p-2.5 border border-slate-border rounded bg-white"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <Icon name="draft" className="text-base text-on-surface-variant" />
                          <span className="text-xs font-label-mono font-semibold text-on-surface truncate">{a.name}</span>
                          <span className="text-[10px] font-label-mono text-on-surface-variant shrink-0">{a.size}</span>
                        </span>
                        <button
                          type="button"
                          title="Remove attachment"
                          className="text-on-surface-variant hover:text-error transition-colors p-1"
                          onClick={() =>
                            update(
                              "attachments",
                              draft.attachments.filter((x) => x.key !== a.key),
                            )
                          }
                        >
                          <Icon name="close" className="text-base" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {/* ------------------------------------------- STEP 4: Review */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <ReviewSection title="General Info" icon="assignment" onEdit={() => setStep(0)}>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  <ReviewItem label="Employee">
                    {owner.name} ({owner.id})
                  </ReviewItem>
                  <ReviewItem label="Client">{clientName(draft.clientId)}</ReviewItem>
                  <ReviewItem label="Job Title" wide>
                    {draft.title}
                  </ReviewItem>
                  <ReviewItem label="Category">{draft.category}</ReviewItem>
                  <ReviewItem label="Priority">
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-label-mono font-bold uppercase ${priorityTone[draft.priority]}`}>
                      {priorityLabel[draft.priority]}
                    </span>
                  </ReviewItem>
                  <ReviewItem label="Start Date">{draft.startDate}</ReviewItem>
                  <ReviewItem label="End Date">{draft.endDate}</ReviewItem>
                </dl>
              </ReviewSection>

              <ReviewSection title="Scope & Subtasks" icon="rule" onEdit={() => setStep(1)}>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-3">{draft.description}</p>
                <ol className="flex flex-col gap-1.5">
                  {draft.subtasks.map((s, i) => (
                    <li key={s.key} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded bg-slate-dark text-white font-label-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-semibold text-on-surface truncate">{s.title}</span>
                      </span>
                      <span className="text-[11px] font-label-mono text-on-surface-variant shrink-0">
                        {employeeName(s.assigneeId)}
                        {s.estimate && ` • ${s.estimate}`}
                      </span>
                    </li>
                  ))}
                </ol>
              </ReviewSection>

              <ReviewSection title="Personnel & Attachments" icon="engineering" onEdit={() => setStep(2)}>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[owner.id, ...draft.participantIds].map((id) => (
                    <span
                      key={id}
                      className="px-2 py-1 rounded border border-slate-border bg-white text-[11px] font-label-mono text-slate-dark"
                    >
                      {employeeName(id)} <span className="text-on-surface-variant">({id})</span>
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {draft.attachments.map((a) => (
                    <span
                      key={a.key}
                      className="px-2 py-1 rounded bg-slate-100 text-[11px] font-label-mono text-on-surface-variant flex items-center gap-1"
                    >
                      <Icon name="attach_file" className="text-xs" /> {a.name}
                    </span>
                  ))}
                </div>
              </ReviewSection>

              <label className="flex items-start gap-2.5 p-3 border border-slate-border rounded-lg bg-slate-surface cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox mt-0.5 rounded text-safety-orange focus:ring-safety-orange"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                <span className="text-xs text-on-surface">
                  I confirm the ticket details are accurate and the crew has been briefed on the safety protocol.
                </span>
              </label>
              <ErrorText show={errorsOn && !checks[3][0].ok}>Tick the confirmation before dispatching.</ErrorText>
            </div>
          )}

          {/* Stepper Controls & Navigation Footer */}
          <div className="pt-5 border-t border-slate-border mt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            {step > 0 ? (
              <button
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-border rounded font-label-mono text-xs uppercase tracking-wider font-semibold text-on-surface hover:bg-slate-100 hover:border-slate-400 transition-colors"
                type="button"
                onClick={() => setStep(step - 1)}
              >
                <Icon name="arrow_back" className="text-base" />
                <span>
                  Back to Step {step}: {STEPS[step - 1].short}
                </span>
              </button>
            ) : (
              <Link
                href={mode === "edit" ? `/employee/tickets/${ticketId}` : "/employee/tickets"}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-border rounded font-label-mono text-xs uppercase tracking-wider font-semibold text-on-surface hover:bg-slate-100 hover:border-slate-400 transition-colors"
              >
                <Icon name="close" className="text-base" />
                Cancel
              </Link>
            )}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {draftSavedAt && (
                <span className="hidden md:inline text-[11px] font-label-mono text-industrial-green">Saved {draftSavedAt}</span>
              )}
              <button
                className="px-4 py-2.5 border border-slate-border rounded font-label-mono text-xs uppercase tracking-wider font-semibold text-on-surface-variant hover:bg-slate-100 transition-colors"
                type="button"
                onClick={saveDraft}
              >
                Save Draft
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 btn-safety rounded font-label-mono text-xs uppercase tracking-wider font-semibold text-white shadow hover:shadow-md transition-all"
                  type="button"
                  onClick={next}
                >
                  <span>
                    Continue to Step {step + 2}: {STEPS[step + 1].short}
                  </span>
                  <Icon name="arrow_forward" className="text-base" />
                </button>
              ) : (
                <button
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 btn-safety rounded font-label-mono text-xs uppercase tracking-wider font-semibold text-white shadow hover:shadow-md transition-all"
                  type="button"
                  onClick={submit}
                >
                  <span>{mode === "create" ? "Dispatch Ticket" : "Save Changes"}</span>
                  <Icon name={mode === "create" ? "send" : "save"} className="text-base" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Right Companion Column: Step Blueprint & Recent Tickets */}
      <aside className="flex flex-col gap-5 lg:col-span-4">
        <Card>
          <CardHeader
            icon="fact_check"
            title="Step Validation Checklist"
            right={
              <span className="text-[10px] font-label-mono text-on-surface-variant">
                {checks.flat().filter((c) => c.ok).length}/{checks.flat().length} passed
              </span>
            }
          />
          <div className="divide-y divide-slate-border">
            {STEPS.map((s, i) => {
              const valid = stepValid(i);
              const open = i === step;
              return (
                <div key={s.short} className={`p-3 ${open ? "bg-orange-50/40" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-label-mono text-[11px] font-semibold uppercase tracking-wider ${
                        open ? "text-safety-orange" : "text-slate-dark"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}. {s.short}
                    </span>
                    {valid ? (
                      <Icon name="check_circle" className="text-industrial-green text-base" fill />
                    ) : (
                      <Icon name="pending" className="text-outline text-base" />
                    )}
                  </div>
                  {open && (
                    <ul className="mt-2 flex flex-col gap-1">
                      {checks[i].map((c) => (
                        <li key={c.label} className="flex items-center gap-1.5 text-[11px]">
                          <Icon
                            name={c.ok ? "check" : "radio_button_unchecked"}
                            className={`text-xs ${c.ok ? "text-industrial-green" : "text-outline"}`}
                          />
                          <span className={c.ok ? "text-on-surface" : "text-on-surface-variant"}>{c.label}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
        {sidebar}
      </aside>
    </div>
  );
}

function ReviewSection({
  title,
  icon,
  onEdit,
  children,
}: {
  title: string;
  icon: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className="border border-slate-border rounded-lg bg-slate-surface p-4">
      <div className="flex items-center justify-between border-b border-slate-border pb-2 mb-3">
        <span className="font-label-mono text-xs uppercase tracking-wider font-semibold text-slate-dark flex items-center gap-1">
          <Icon name={icon} className="text-sm text-safety-orange" /> {title}
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="text-[11px] font-label-mono font-semibold text-slate-dark hover:text-safety-orange inline-flex items-center gap-1 transition-colors"
        >
          <Icon name="edit" className="text-xs" /> Edit
        </button>
      </div>
      {children}
    </section>
  );
}

function ReviewItem({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-[10px] font-label-mono uppercase text-on-surface-variant font-semibold">{label}</dt>
      <dd className="text-xs font-semibold text-on-surface mt-0.5">{children}</dd>
    </div>
  );
}
