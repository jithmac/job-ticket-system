"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { formatDateTime, priorityLabel, priorityOrder } from "@/lib/format";
import type { Priority, PriorityRequest } from "@/lib/types";
import { PriorityTag, SectionCard, SectionHeading } from "./ui";

/** Customer care can't change priority directly — they raise a request for an admin to approve. */
export function PriorityRequestForm({
  current,
  initial,
  agent,
}: {
  current: Priority;
  initial: PriorityRequest[];
  agent: { id: string; name: string };
}) {
  const [requests, setRequests] = useState(initial);
  const [to, setTo] = useState<Priority | "">("");
  const [reason, setReason] = useState("");
  const pending = requests.some((r) => r.status === "pending");

  function submit() {
    if (!to || to === current || reason.trim().length < 10) return;
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    setRequests((r) => [
      {
        id: `PR-new-${r.length}`,
        from: current,
        to,
        reason: reason.trim(),
        requestedBy: `${agent.name} (${agent.id})`,
        at: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`,
        status: "pending",
      },
      ...r,
    ]);
    setTo("");
    setReason("");
  }

  return (
    <SectionCard>
      <SectionHeading
        icon="swap_vert"
        title="Request Priority Change"
        right={
          <span className="flex items-center gap-space-xs font-label-mono-sm text-label-mono-sm text-on-surface-variant">
            CURRENT: <PriorityTag priority={current} suffix={false} />
          </span>
        }
      />
      {pending ? (
        <p className="p-space-sm rounded bg-secondary-fixed/40 font-body-sm text-body-sm text-on-secondary-fixed flex items-center gap-space-xs">
          <Icon name="hourglass_top" className="text-[16px]" /> A request is awaiting admin approval. You’ll be notified once it is reviewed.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
          <div className="flex flex-col gap-space-xs">
            <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">Requested Level</span>
            <div className="grid grid-cols-2 gap-space-xs">
              {priorityOrder.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={p === current}
                  onClick={() => setTo(p)}
                  className={`py-1.5 rounded font-label-mono-sm text-label-mono-sm uppercase font-bold transition-all disabled:opacity-40 ${
                    to === p ? "bg-slate-dark text-on-primary" : "bg-surface-container-low text-slate-dark hover:bg-surface-container"
                  }`}
                >
                  {priorityLabel[p]}
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 flex flex-col gap-space-xs">
            <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">Reason (sent to admin)</span>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Client reports standby equipment at risk; production shutdown in 48h."
              className="w-full p-space-sm rounded bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-1 focus:ring-slate-dark resize-none placeholder:text-on-surface-variant/60"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!to || reason.trim().length < 10}
              className="self-end px-space-md py-2 bg-safety-orange hover:bg-safety-orange-bright text-on-primary rounded font-label-mono text-label-mono font-bold transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
            >
              <Icon name="send" className="text-[16px]" /> Submit Request
            </button>
          </div>
        </div>
      )}
      {requests.length > 0 && (
        <div className="flex flex-col gap-space-xs pt-space-xs border-t border-slate-border/30">
          {requests.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-space-xs p-space-xs bg-surface-container-low rounded font-body-sm text-body-sm">
              <span className="flex items-center gap-space-xs">
                <span className="font-label-mono-sm text-label-mono-sm font-bold text-slate-dark uppercase">
                  {priorityLabel[r.from]} → {priorityLabel[r.to]}
                </span>
                <span className="text-on-surface-variant">{r.reason}</span>
              </span>
              <span className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                {formatDateTime(r.at)} •{" "}
                <span
                  className={`font-bold uppercase ${
                    r.status === "approved" ? "text-industrial-green" : r.status === "declined" ? "text-error" : "text-machinery-amber"
                  }`}
                >
                  {r.status}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
