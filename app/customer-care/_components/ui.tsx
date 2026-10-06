import type { ReactNode } from "react";
import { Icon } from "@/components/icon";
import { priorityLabel } from "@/lib/format";
import type { Priority } from "@/lib/types";

/* Building blocks that reproduce the customer-care sample styling. */

const priorityStyles: Record<Priority, string> = {
  critical: "bg-error-container text-on-error-container",
  high: "bg-secondary-fixed text-on-secondary-fixed",
  medium: "bg-surface-container-high text-on-surface",
  low: "bg-surface-container text-on-surface-variant",
};

export function PriorityTag({ priority, suffix = true }: { priority: Priority; suffix?: boolean }) {
  return (
    <span
      className={`px-space-xs py-0.5 rounded font-label-mono-sm text-label-mono-sm font-bold uppercase tracking-wider shrink-0 ${priorityStyles[priority]}`}
    >
      {priorityLabel[priority]}
      {suffix && (priority === "high" || priority === "low") ? " Priority" : ""}
    </span>
  );
}

export function SectionCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-surface-container-lowest p-space-lg rounded shadow-sm flex flex-col gap-space-md ${className}`}>{children}</div>;
}

export function SectionHeading({ icon, title, right }: { icon: string; title: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-space-xs">
      <div className="flex items-center gap-space-xs">
        <Icon name={icon} className="text-safety-orange text-[20px]" />
        <h3 className="font-headline-sm text-headline-sm uppercase text-slate-dark">{title}</h3>
      </div>
      {right}
    </div>
  );
}

/** Dark full-width "command header" band used at the top of every care page. */
export function CommandBand({ children }: { children: ReactNode }) {
  return (
    <section className="w-full bg-slate-dark text-on-primary px-margin py-space-lg shadow-md relative overflow-hidden">
      <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-safety-orange/10 blur-3xl pointer-events-none"></div>
      <div className="relative max-w-[1440px] mx-auto w-full flex flex-col gap-space-md">{children}</div>
    </section>
  );
}
