"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { formatDateTime } from "@/lib/format";
import type { ActivityEntry, Employee } from "@/lib/types";
import { addAdminActivity } from "../actions";

/** "Activity & Operational Log" timeline with the admin log-update box. */
export function ActivityLog({
  entries,
  people,
  author,
  ticketId,
}: {
  entries: ActivityEntry[];
  ticketId: string;
  /** Employees referenced by the entries. */
  people: Employee[];
  author: { name: string; role: string };
}) {
  const [log, setLog] = useState(entries);
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!text.trim()) return;
    const entryText = text.trim();
    setSaving(true);
    const result = await addAdminActivity({ ticketId, text: entryText });
    setSaving(false);
    if (!result.ok) return;
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    setLog((l) => [
      ...l,
      {
        id: `admin-${l.length}`,
        kind: "admin",
        authorName: author.name,
        authorRole: author.role,
        at: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`,
        text: entryText,
        visibleToEmployees: true,
      },
    ]);
    setText("");
  }

  return (
    <section className="bg-white border border-slate-200 rounded p-6 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-base font-headline-md font-bold text-slate-900 flex items-center gap-2">
          <Icon name="history" className="text-slate-700 text-lg" />
          Activity &amp; Operational Log
        </h2>
        <button type="button" onClick={() => setExpanded((value) => !value)} className="text-xs font-label-mono text-slate-400 flex items-center gap-1">
          {log.length} ENTRIES <Icon name={expanded ? "expand_less" : "expand_more"} className="text-base" />
        </button>
      </div>
      {expanded && <div className="relative pl-5 border-l-2 border-slate-200 ml-3 mt-1 space-y-6">
        {log.length === 0 && <p className="text-xs font-label-mono text-slate-400">No activity logged yet.</p>}
        {log.map((a) => {
          const person = people.find((p) => p.id === a.authorId);
          if (a.kind === "system") {
            return (
              <div key={a.id} className="relative">
                <div className="absolute -left-[27px] bg-slate-100 rounded-full w-3.5 h-3.5 border-2 border-slate-400 flex items-center justify-center mt-1"></div>
                <div className="flex justify-between items-baseline mb-1 gap-2">
                  <span className="text-xs font-label-mono font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <Icon name="memory" className="text-xs text-slate-500" />
                    {a.authorName}
                  </span>
                  <span className="text-[11px] font-label-mono text-slate-400">{formatDateTime(a.at)}</span>
                </div>
                <p className="text-xs font-body-sm text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">{a.text}</p>
              </div>
            );
          }
          return (
            <div key={a.id} className="relative">
              <div className="absolute -left-[32px]">
                <span className="w-7 h-7 rounded border-2 border-white bg-slate-800 text-white flex items-center justify-center shadow-sm text-[10px] font-label-mono font-bold">
                  {(person?.name ?? (a.kind === "admin" ? author.name : a.authorName))
                    .split(/\s+/)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-baseline mb-1 gap-2">
                <span className="text-xs font-headline-md font-bold text-slate-900">
                  {a.authorName}{" "}
                  <span className="font-label-mono text-[10px] text-slate-400 font-normal">[{a.authorRole}]</span>
                  {a.kind === "customer-care" && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-orange-50 text-safety-orange border border-safety-orange/30 font-label-mono text-[9px]">
                      CARE NOTE
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-label-mono text-slate-400 shrink-0">{formatDateTime(a.at)}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded border border-slate-200 text-xs font-body-sm text-slate-700 leading-relaxed">{a.text}</div>
            </div>
          );
        })}
      </div>}
      {expanded && <div className="mt-2 pt-4 border-t border-slate-200 flex gap-3">
        <span className="w-8 h-8 rounded border border-slate-300 bg-slate-800 text-white flex items-center justify-center text-[10px] font-label-mono font-bold mt-0.5">
          {author.name
            .split(/\s+/)
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </span>
        <div className="flex-1 flex flex-col gap-2">
          <textarea
            className="form-textarea w-full bg-slate-50 border border-slate-200 rounded p-3 text-xs font-body-sm text-slate-800 placeholder:text-slate-400 focus:border-safety-orange focus:bg-white focus:ring-1 focus:ring-safety-orange outline-none resize-none h-20 transition-all"
            placeholder="Enter diagnostic findings, patch reference, or internal log..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setText("")}
              className="px-3.5 py-1.5 text-slate-600 text-xs font-semibold hover:bg-slate-100 rounded transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={saving}
              className="px-4 py-1.5 bg-slate-dark hover:bg-slate-800 text-white rounded text-xs font-label-mono font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Icon name="send" className="text-sm text-safety-orange" />
              {saving ? "Saving..." : "Log Update"}
            </button>
          </div>
        </div>
      </div>}
    </section>
  );
}
