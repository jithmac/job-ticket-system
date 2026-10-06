"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { formatTime } from "@/lib/format";
import type { ActivityEntry } from "@/lib/types";
import { SectionCard, SectionHeading } from "./ui";

const MACROS = [
  "Customer called for ETA",
  "Client requested progress photos",
  "Client authorized next phase",
  "Rescheduled technician arrival",
];

function nowIso() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

/** Notes logger: notes flagged "visible" appear on the employee's ticket page. */
export function CareNotes({
  ticketId,
  contactName,
  agent,
  initial,
}: {
  ticketId: string;
  contactName: string;
  agent: { id: string; name: string };
  initial: ActivityEntry[];
}) {
  const [notes, setNotes] = useState(initial);
  const [text, setText] = useState("");
  const [visible, setVisible] = useState(true);
  const [emailCopy, setEmailCopy] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

  function save(alert = false) {
    const value = text.trim();
    if (!value && !alert) return;
    setNotes((n) => [
      {
        id: `care-${n.length}`,
        kind: "customer-care",
        authorId: agent.id,
        authorName: agent.name,
        authorRole: "Customer Care",
        at: nowIso(),
        text: alert ? `FIELD ALERT: ${value || "Please contact customer care regarding this ticket."}` : value,
        visibleToEmployees: alert ? true : visible,
      },
      ...n,
    ]);
    setText("");
    if (alert) {
      setAlertSent(true);
      setTimeout(() => setAlertSent(false), 2400);
    }
  }

  return (
    <SectionCard>
      <SectionHeading
        icon="edit_note"
        title="Ticket Notes for Field Crew"
        right={<span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">Dispatcher ID: #{agent.id}</span>}
      />
      <div className="flex flex-wrap gap-space-xs">
        {MACROS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setText((t) => (t ? `${t} | ${m}` : m))}
            className="px-space-xs py-1 rounded bg-surface-container-low hover:bg-surface-container text-slate-dark font-label-mono-sm text-label-mono-sm transition-all"
          >
            + {m}
          </button>
        ))}
      </div>
      <textarea
        aria-label={`Note for ${ticketId}`}
        className="w-full p-space-sm rounded bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-slate-dark resize-none placeholder:text-on-surface-variant/60"
        placeholder="Add a note for the employees on this ticket, or log a customer inquiry..."
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
        <div className="flex flex-wrap items-center gap-space-sm">
          <label className="flex items-center gap-space-xs cursor-pointer select-none">
            <input checked={visible} onChange={(e) => setVisible(e.target.checked)} className="w-3.5 h-3.5 accent-safety-orange" type="checkbox" />
            <span className="font-label-mono-sm text-label-mono-sm text-slate-dark uppercase font-bold">Visible to Employees</span>
          </label>
          <label className="hidden sm:flex items-center gap-space-xs cursor-pointer select-none">
            <input checked={emailCopy} onChange={(e) => setEmailCopy(e.target.checked)} className="w-3.5 h-3.5 accent-safety-orange" type="checkbox" />
            <span className="font-label-mono-sm text-label-mono-sm text-slate-dark uppercase font-bold">Email {contactName} Copy</span>
          </label>
        </div>
        <div className="flex items-center gap-space-xs">
          <button
            type="button"
            onClick={() => save()}
            className="px-space-md py-2 bg-slate-dark hover:bg-slate-dark/90 text-on-primary rounded font-label-mono text-label-mono font-bold transition-all shadow-sm"
          >
            Add Note
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            className={`px-space-md py-2 ${alertSent ? "bg-industrial-green" : "bg-safety-orange hover:bg-safety-orange-bright"} text-on-primary rounded font-label-mono text-label-mono font-bold transition-all shadow-sm flex items-center gap-1`}
          >
            <Icon name={alertSent ? "sync" : "cell_tower"} className={`text-[18px] ${alertSent ? "animate-spin" : ""}`} />
            <span>{alertSent ? "Alert Sent!" : "Dispatch Alert to Field Crew"}</span>
          </button>
        </div>
      </div>
      <div className="mt-space-sm pt-space-sm border-t border-slate-border/30 flex flex-col gap-space-xs">
        <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase font-bold">Notes &amp; Communications Audit</span>
        {notes.length === 0 && <span className="font-body-sm text-body-sm text-on-surface-variant">No notes on this ticket yet.</span>}
        {notes.map((n) => (
          <div key={n.id} className="flex items-start justify-between gap-space-sm p-space-xs bg-surface-container-low rounded font-body-sm text-body-sm">
            <div className="flex items-start gap-space-xs min-w-0">
              <Icon
                name={n.kind === "customer-care" ? "support_agent" : n.kind === "system" ? "memory" : "engineering"}
                className={`text-[16px] mt-px ${n.kind === "customer-care" ? "text-safety-orange" : "text-industrial-green"}`}
              />
              <span className="font-label-mono-sm text-label-mono-sm font-bold text-slate-dark shrink-0 mt-px">[{formatTime(n.at)}]</span>
              <span className="text-on-surface">{n.text}</span>
            </div>
            <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant shrink-0 text-right">
              {n.authorName}
              {n.kind === "customer-care" && (
                <span className={`block ${n.visibleToEmployees ? "text-industrial-green" : "text-on-surface-variant"}`}>
                  {n.visibleToEmployees ? "VISIBLE TO CREW" : "INTERNAL"}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
