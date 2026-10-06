import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icon";
import { priorityLabel, statusLabel } from "@/lib/format";
import type { Priority, TicketStatus } from "@/lib/types";

/* Building blocks that reproduce the employee-panel sample styling. */

export function PageHeader({
  title,
  subtitle,
  meta,
  back,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between border-b border-slate-border pb-4 gap-2">
      <div>
        {back && (
          <Link
            href={back.href}
            className="flex items-center gap-1 mb-2 font-label-mono text-xs uppercase tracking-wider font-semibold text-on-surface-variant hover:text-safety-orange transition-colors w-fit"
          >
            <Icon name="arrow_back" className="text-sm" />
            {back.label}
          </Link>
        )}
        <h2 className="font-headline-xl font-bold text-on-background tracking-tight text-2xl">{title}</h2>
        {subtitle && <p className="text-on-surface-variant mt-1">{subtitle}</p>}
      </div>
      {meta && <div className="font-label-mono text-xs text-on-surface-variant">{meta}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-surface-container-lowest border border-slate-border rounded-lg shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ icon, title, right }: { icon: string; title: ReactNode; right?: ReactNode }) {
  return (
    <div className="p-3.5 border-b border-slate-border bg-slate-surface flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <Icon name={icon} className="text-on-surface-variant text-base" />
        <h3 className="font-headline-sm font-bold text-on-surface text-xs tracking-tight">{title}</h3>
      </div>
      {right}
    </div>
  );
}

// These all are reusable react components

export function FieldLabel({
  // this is function declarion
  htmlFor,
  icon,
  children,
  required,
  hint,
}: {
  // This defines the types oof the prope. like data types.
  htmlFor?: string;
  icon: string;
  children: ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label
      // This is Tailwind CSS
      className="font-label-mono text-xs uppercase tracking-wider font-semibold text-slate-dark flex items-center justify-between gap-2"
      htmlFor={htmlFor}
    >
      <span className="flex items-center gap-1">
        // This uses the Icon component from UI
        <Icon name={icon} className="text-sm text-safety-orange" />
        // This is the label text 
        {children} {required && <span className="text-safety-orange font-bold">*</span>}
      </span>
      {hint && <span className="text-[11px] font-label-mono text-outline font-normal">{hint}</span>}
    </label>
  );
}

const statusStyles: Record<TicketStatus, string> = {
  draft: "bg-slate-100 text-on-surface-variant border-slate-border",
  open: "bg-slate-100 text-slate-dark border-slate-border",
  in_progress: "bg-amber-50 text-machinery-amber border-amber-300",
  on_hold: "bg-slate-100 text-on-surface-variant border-slate-border",
  awaiting_signoff: "bg-orange-50 text-safety-orange border-orange-200",
  completed: "bg-green-50 text-industrial-green border-green-300",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-label-mono font-semibold border whitespace-nowrap ${statusStyles[status]}`}
    >
      {status === "completed" ? "Resolved" : statusLabel[status]}
    </span>
  );
}

const priorityStyles: Record<Priority, string> = {
  low: "bg-slate-100 text-on-surface-variant border-slate-border",
  medium: "bg-amber-50 text-machinery-amber border-amber-300",
  high: "bg-orange-50 text-safety-orange border-orange-200",
  critical: "bg-red-50 text-error border-red-200",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-label-mono font-semibold border uppercase whitespace-nowrap ${priorityStyles[priority]}`}
    >
      {priority === "critical" && <Icon name="warning" className="text-xs" fill />}
      {priorityLabel[priority]}
    </span>
  );
}

export function ProgressBar({ value, tone = "orange" }: { value: number; tone?: "orange" | "green" }) {
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${tone === "green" || value === 100 ? "bg-industrial-green" : "bg-safety-orange"}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function SlaPolicyBanner() {
  return (
    <div className="bg-surface-container-lowest border border-slate-border rounded-lg p-3.5 shadow-sm flex items-start gap-2.5">
      <Icon name="verified_user" className="text-industrial-green text-lg mt-0.5" />
      <div className="flex flex-col gap-0.5">
        <span className="font-label-mono text-xs font-semibold text-slate-dark uppercase tracking-wider">SLA Dispatch Policy</span>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Tickets logged before 16:00 EST undergo automatic telemetry check &amp; dispatch triage within 30 min.
        </p>
      </div>
    </div>
  );
}
