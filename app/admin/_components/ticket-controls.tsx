"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { formatDateTime, priorityLabel } from "@/lib/format";
import type { PriorityRequest, TicketStatus } from "@/lib/types";
import { deleteAdminTicket, setAdminTicketHold } from "../actions";

/** Operational controls + priority-change requests + ticket properties (admin ticket sidebar). */
export function TicketControls({
  status: initialStatus,
  requests: initialRequests,
  ticketId,
  children,
}: {
  status: TicketStatus;
  requests: PriorityRequest[];
  ticketId: string;
  /** Rendered between the controls and the properties card (sample order). */
  children?: ReactNode;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [requests, setRequests] = useState(initialRequests);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const router = useRouter();
  const onHold = status === "on_hold";

  function decide(id: string, decision: "approved" | "declined") {
    setRequests((list) => list.map((r) => (r.id === id ? { ...r, status: decision } : r)));
  }

  return (
    <>
      <section className="bg-white border-2 border-safety-orange/40 rounded p-5 flex flex-col gap-3 shadow-sm">
        <div className="text-[11px] font-label-mono uppercase tracking-wider text-slate-500 font-bold flex items-center justify-between">
          <span>OPERATIONAL CONTROLS</span>
          <span className={`w-2 h-2 rounded-full ${onHold ? "bg-amber-400" : "bg-safety-orange animate-pulse"}`}></span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={async () => {
              const result = await setAdminTicketHold({ ticketId, hold: !onHold });
              if (result.ok) setStatus(onHold ? "open" : "on_hold");
            }}
            className="border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 py-2 rounded text-xs font-label-mono font-semibold transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
          >
            <Icon name="pause_circle" className="text-sm text-slate-600" /> {onHold ? "Remove Hold" : "Put On Hold"}
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!deleteConfirm) {
                setDeleteConfirm(true);
                return;
              }
              setDeleting(true);
              const result = await deleteAdminTicket(ticketId);
              if (result.ok) router.replace("/admin/tickets");
              else setDeleting(false);
            }}
            disabled={deleting}
            className="border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 py-2 rounded text-xs font-label-mono font-semibold transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
          >
            <Icon name="delete" className="text-sm" /> {deleting ? "Deleting..." : deleteConfirm ? "Confirm Delete" : "Delete Ticket"}
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

    </>
  );
}
