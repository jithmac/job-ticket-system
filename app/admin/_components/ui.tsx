import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icon";
import { formatDateTime, phaseLabel, priorityLabel, statusLabel, subtaskProgress } from "@/lib/format";
import type { Priority, Subtask, TicketStatus } from "@/lib/types";

/* Building blocks that reproduce the admin-panel sample styling. */

export function Panel({ children, className = "", padded = "p-6" }: { children: ReactNode; className?: string; padded?: string }) {
  return (
    <section className={`bg-white border border-slate-200 rounded ${padded} flex flex-col gap-4 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

export function PanelTitle({
  icon,
  title,
  iconClass = "text-safety-orange",
  right,
}: {
  icon: string;
  title: ReactNode;
  iconClass?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
      <h2 className="text-base font-headline-md font-bold text-slate-900 flex items-center gap-2">
        <Icon name={icon} className={`${iconClass} text-lg`} />
        {title}
      </h2>
      {right}
    </div>
  );
}

export function SideTitle({ icon, title, right }: { icon: string; title: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
      <div className="flex items-center gap-1.5">
        <Icon name={icon} className="text-safety-orange text-base" />
        <h3 className="text-xs font-label-mono uppercase tracking-wider text-slate-800 font-bold">{title}</h3>
      </div>
      {right}
    </div>
  );
}

export function Chip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`text-xs font-label-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 ${className}`}>
      {children}
    </span>
  );
}

export function PageTitle({
  id,
  badges,
  title,
  back,
  backMeta,
  actions,
}: {
  id?: string;
  badges?: ReactNode;
  title: ReactNode;
  back?: { href: string; label: string };
  backMeta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <>
      {back && (
        <div className="mb-4 flex items-center justify-between text-slate-500 text-xs font-label-mono">
          <Link
            className="hover:text-slate-900 transition-colors flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-600"
            href={back.href}
          >
            <Icon name="arrow_back" className="text-sm" />
            {back.label}
          </Link>
          {backMeta && <span className="hidden sm:inline-block text-[11px] text-slate-400">{backMeta}</span>}
        </div>
      )}
      <div className="mb-6 bg-white border border-slate-200 rounded p-5 shadow-sm flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          {(id || badges) && (
            <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
              {id && (
                <span className="font-label-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                  {id}
                </span>
              )}
              {badges}
            </div>
          )}
          <h1 className="text-xl md:text-2xl font-headline-lg font-bold text-slate-900 tracking-tight">{title}</h1>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </>
  );
}

const priorityStyles: Record<Priority, string> = {
  critical: "bg-red-50 text-error border-red-200",
  high: "bg-orange-50 text-safety-orange border-safety-orange/30",
  medium: "bg-amber-100 text-amber-900 border-amber-300",
  low: "bg-slate-100 text-slate-700 border-slate-300",
};

export function PriorityPill({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-label-mono font-bold text-xs uppercase whitespace-nowrap ${priorityStyles[priority]}`}
    >
      {(priority === "critical" || priority === "high") && <Icon name="warning" className="text-sm" fill />}
      {priorityLabel[priority]}
    </span>
  );
}

const statusStyles: Record<TicketStatus, { cls: string; dot: string }> = {
  draft: { cls: "bg-slate-100 text-slate-600 border-slate-300", dot: "bg-slate-400" },
  open: { cls: "bg-emerald-100 text-industrial-green-deep border-emerald-300", dot: "bg-industrial-green-bright" },
  in_progress: { cls: "bg-amber-100 text-amber-900 border-amber-300", dot: "bg-machinery-amber" },
  on_hold: { cls: "bg-slate-100 text-slate-600 border-slate-300", dot: "bg-slate-400" },
  awaiting_signoff: { cls: "bg-orange-50 text-safety-orange border-safety-orange/30", dot: "bg-safety-orange" },
  completed: { cls: "bg-slate-100 text-slate-600 border-slate-300", dot: "bg-industrial-green" },
};

export function StatusPill({ status }: { status: TicketStatus }) {
  const s = statusStyles[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded border font-label-mono font-bold text-xs uppercase tracking-wider whitespace-nowrap ${s.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span> {statusLabel[status]}
    </span>
  );
}

const colsClass: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

/** "Job Process & Operational Lifecycle" phase cards from the admin sample. */
export function PhaseGrid({ subtasks }: { subtasks: Subtask[] }) {
  return (
    <div className={`grid grid-cols-1 ${colsClass[Math.min(subtasks.length, 4)] ?? "md:grid-cols-4"} gap-3 pt-1`}>
      {subtasks.map((s, i) => {
        const pct = subtaskProgress(s);
        if (s.status === "done") {
          return (
            <div key={s.id} className="bg-slate-50 border-l-4 border-industrial-green p-3 rounded-r border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-label-mono font-bold text-industrial-green uppercase">{phaseLabel(i)}</span>
                <Icon name="check_circle" className="text-industrial-green text-sm" fill />
              </div>
              <div className="text-xs font-bold text-slate-900">{s.title}</div>
              <div className="text-[10px] font-label-mono text-slate-500 mt-1">
                Completed • {s.completedAt ? formatDateTime(s.completedAt) : "—"}
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-industrial-green h-full w-full"></div>
              </div>
            </div>
          );
        }
        if (s.status === "in_progress") {
          return (
            <div key={s.id} className="bg-orange-50/40 border-l-4 border-safety-orange p-3 rounded-r border border-orange-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-label-mono font-bold text-safety-orange uppercase">{phaseLabel(i)}</span>
                <span className="inline-flex items-center px-1.5 bg-safety-orange text-white text-[9px] font-label-mono font-bold rounded uppercase animate-pulse">
                  Active
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900">{s.title}</div>
              <div className="text-[10px] font-label-mono text-slate-600 mt-1">Running • {pct}% In Progress</div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-safety-orange h-full" style={{ width: `${pct}%` }}></div>
              </div>
            </div>
          );
        }
        return (
          <div key={s.id} className="bg-slate-50 border-l-4 border-slate-300 p-3 rounded-r border border-slate-200 opacity-80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-label-mono font-bold text-slate-500 uppercase">{phaseLabel(i)}</span>
              <Icon name={i === subtasks.length - 1 ? "verified" : "pending"} className="text-slate-400 text-sm" />
            </div>
            <div className="text-xs font-bold text-slate-800">{s.title}</div>
            <div className="text-[10px] font-label-mono text-slate-400 mt-1">Pending {phaseLabel(i - 1)}</div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-slate-300 h-full w-0"></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProgressTrack({ value, tone }: { value: number; tone?: string }) {
  const color = tone ?? (value === 100 ? "bg-industrial-green" : "bg-safety-orange");
  return (
    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
      <div className={`${color} h-full`} style={{ width: `${value}%` }}></div>
    </div>
  );
}

export function StatCard({ label, value, icon, sub, tone = "text-safety-orange" }: { label: string; value: ReactNode; icon: string; sub?: ReactNode; tone?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-label-mono uppercase tracking-wider text-slate-500 font-bold">{label}</span>
        <Icon name={icon} className={`${tone} text-lg`} />
      </div>
      <div className="text-2xl font-headline-lg font-bold text-slate-900 leading-none">{value}</div>
      {sub && <div className="text-[11px] font-label-mono text-slate-500">{sub}</div>}
    </div>
  );
}
