"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/icon";
import { formatDate, formatDateTime, priorityLabel } from "@/lib/format";
import type { Priority, PriorityRequest, TicketStatus } from "@/lib/types";
import { PriorityPill, StatusPill } from "./ui";

/** Operational controls + priority-change requests + ticket properties (admin ticket sidebar). */
export function TicketControls({
  status: initialStatus,
  priority: initialPriority,
  requests: initialRequests,
  category,
  endDate,
  holder,
  children,
}: {
  status: TicketStatus;
  priority: Priority;
  requests: PriorityRequest[];
  category: string;
  endDate: string;
  holder: string;
  /** Rendered between the controls and the properties card (sample order). */
  children?: ReactNode;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState(initialPriority);
  const [requests, setRequests] = useState(initialRequests);
  const closed = status === "completed";

  function decide(id: string, decision: "approved" | "declined") {
    const req = requests.find((r) => r.id === id);
    if (req && decision === "approved") setPriority(req.to);
    setRequests((list) => list.map((r) => (r.id === id ? { ...r, status: decision } : r)));
  }

  return (
    <>
      {/* Operational Controls & Dispatch Action */}
      <section className="bg-white border-2 border-safety-orange/40 rounded p-5 flex flex-col gap-3 shadow-sm">
        <div className="text-[11px] font-label-mono uppercase tracking-wider text-slate-500 font-bold flex items-center justify-between">
          <span>OPERATIONAL CONTROLS</span>
          <span className={`w-2 h-2 rounded-full ${closed ? "bg-slate-300" : "bg-safety-orange animate-pulse"}`}></span>
        </div>
        <button
          type="button"
          disabled={closed}
          onClick={() => setStatus("in_progress")}
          className="w-full bg-safety-orange hover:bg-safety-orange-bright active:bg-orange-700 text-white py-2.5 px-4 rounded text-xs font-label-mono font-bold tracking-wide uppercase shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Icon name="emergency_home" className="text-base" /> {status === "in_progress" ? "Crew Dispatched" : "Dispatch Crew"}
        </button>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            disabled={closed}
            onClick={() => setStatus("on_hold")}
            className="border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 py-2 rounded text-xs font-label-mono font-semibold transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
          >
            <Icon name="pause_circle" className="text-sm text-slate-600" /> Put On Hold
          </button>
          <button
            type="button"
            onClick={() => setStatus(closed ? "open" : "completed")}
            className="border border-slate-300 bg-slate-50 hover:bg-red-50 hover:border-red-300 text-slate-700 hover:text-red-700 py-2 rounded text-xs font-label-mono font-semibold transition-colors flex items-center justify-center gap-1"
          >
            <Icon name={closed ? "lock_open" : "lock"} className="text-sm" /> {closed ? "Reopen" : "Close Ticket"}
          </button>
        </div>
      </section>

      {/* Priority change requests (raised by customer care) */}
      {requests.length > 0 && (
        <section className="bg-white border border-slate-200 rounded p-5 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <Icon name="swap_vert" className="text-safety-orange text-base" />
              <h3 className="text-xs font-label-mono uppercase tracking-wider text-slate-800 font-bold">Priority Requests</h3>
            </div>
            <span className="text-[10px] font-label-mono text-slate-500">
              {requests.filter((r) => r.status === "pending").length} Pending
            </span>
          </div>
          {requests.map((r) => (
            <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2 text-[11px] font-label-mono">
                <span className="font-bold text-slate-800 uppercase">
                  {priorityLabel[r.from]} → {priorityLabel[r.to]}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded border font-bold uppercase text-[10px] ${
                    r.status === "pending"
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : r.status === "approved"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-slate-100 text-slate-500 border-slate-300"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <p className="text-xs text-slate-700">{r.reason}</p>
              <p className="text-[10px] font-label-mono text-slate-500">
                {r.requestedBy} • {formatDateTime(r.at)}
              </p>
              {r.status === "pending" && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => decide(r.id, "approved")}
                    className="bg-slate-dark hover:bg-slate-800 text-white py-1.5 rounded text-[11px] font-label-mono font-bold flex items-center justify-center gap-1"
                  >
                    <Icon name="check" className="text-sm text-safety-orange" /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => decide(r.id, "declined")}
                    className="border border-slate-300 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-700 text-slate-700 py-1.5 rounded text-[11px] font-label-mono font-semibold flex items-center justify-center gap-1"
                  >
                    <Icon name="close" className="text-sm" /> Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {children}

      {/* Ticket Properties Card */}
      <section className="bg-white border border-slate-200 rounded p-5 flex flex-col gap-4 shadow-sm">
        <h3 className="text-xs font-label-mono uppercase tracking-wider text-slate-500 font-bold border-b border-slate-100 pb-2 flex items-center justify-between">
          <span>Ticket Properties</span>
          <Icon name="tune" className="text-sm text-slate-400" />
        </h3>
        <div className="flex flex-col gap-3.5 text-xs font-body-sm">
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500 font-label-mono">STATUS</span>
            <StatusPill status={status} />
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500 font-label-mono">PRIORITY</span>
            <PriorityPill priority={priority} />
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2">
            <span className="text-slate-500 font-label-mono">CATEGORY</span>
            <span className="font-label-mono text-slate-700 font-semibold text-right">{category}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-100">
            <span className="text-slate-500 font-label-mono">TICKET HOLDER</span>
            <span className="font-label-mono text-slate-700 font-semibold">{holder}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500 font-label-mono">END DATE</span>
            <span className="font-label-mono text-slate-700 font-semibold">{formatDate(endDate)}</span>
          </div>
        </div>
      </section>
    </>
  );
}
