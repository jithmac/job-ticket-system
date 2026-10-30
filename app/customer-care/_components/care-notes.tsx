"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { formatTime } from "@/lib/format";
import type { ActivityEntry } from "@/lib/types";
import { addCareActivity } from "../actions";
import { SectionCard, SectionHeading } from "./ui";

const MACROS = [
  "Customer called for ETA",
  "Client requested progress photos",
  "Client authorized next phase",
  "Rescheduled technician arrival",
];

/** Notes logger: notes flagged "visible" appear on the employee's ticket page. */
export function CareNotes({
  ticketId,
  agent,
  initial,
}: {
  ticketId: string;
  agent: { id: string; name: string };
  initial: ActivityEntry[];
}) {
  const [notes, setNotes] = useState(() => initial.filter((entry) => entry.kind === "customer-care"));
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    const value = text.trim();
    if (!value) return;
    setSaving(true);
    setError("");
    const result = await addCareActivity({ ticketId, text: value });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNotes((notes) => [result.entry, ...notes]);
    setText("");
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
      <div className="flex justify-end pt-space-xs">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="px-space-md py-2 bg-slate-dark hover:bg-slate-dark/90 text-on-primary rounded font-label-mono text-label-mono font-bold transition-all shadow-sm"
        >
          {saving ? "Saving..." : "Add Note"}
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      <div className="mt-space-sm pt-space-sm border-t border-slate-border/30 flex flex-col gap-space-xs">
        <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase font-bold">Notes &amp; Communications Audit</span>
        {notes.length === 0 && <span className="font-body-sm text-body-sm text-on-surface-variant">No customer-care notes on this ticket yet.</span>}
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
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
