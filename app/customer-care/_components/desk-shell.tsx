"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/icon";
import type { CareRow } from "./rows";
import { CommandBand, PriorityTag } from "./ui";

const FILTERS = [
  { key: "active", label: "All Active", test: (r: CareRow) => r.flags.active },
  { key: "critical", label: "Critical Escalations", test: (r: CareRow) => r.flags.critical },
  { key: "signoff", label: "Awaiting Sign-Off", test: (r: CareRow) => r.flags.signoff },
  { key: "field", label: "Field Dispatched", test: (r: CareRow) => r.flags.field },
  { key: "overdue", label: "Overdue SLA", test: (r: CareRow) => r.flags.overdue },
  { key: "closed", label: "Closed", test: (r: CareRow) => r.flags.completed },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const PAGE_SIZE = 5;

const SORTS = {
  urgency: { label: "SLA Urgency", fn: (a: CareRow, b: CareRow) => b.urgency - a.urgency },
  progress: { label: "Progress %", fn: (a: CareRow, b: CareRow) => b.progress - a.progress },
  end: { label: "End Date", fn: (a: CareRow, b: CareRow) => a.endDate.localeCompare(b.endDate) },
  id: { label: "Ticket ID", fn: (a: CareRow, b: CareRow) => b.id.localeCompare(a.id) },
} as const;

const slaTone = { ok: "text-industrial-green", warn: "text-machinery-amber", bad: "text-error", muted: "text-on-surface-variant" };
const footTone = { ok: "text-industrial-green", warn: "text-machinery-amber", bad: "text-error", dark: "text-slate-dark" };
const barTone = { orange: "bg-safety-orange", green: "bg-industrial-green", dark: "bg-slate-dark", red: "bg-error" };

/**
 * Lives in the (desk) layout, so the search box, filters and page stay put while
 * the dossier on the right changes with the URL (/customer-care/tickets/[id]).
 */
export function DeskShell({ rows, defaultId, children }: { rows: CareRow[]; defaultId: string; children: ReactNode }) {
  const pathname = usePathname();
  const selectedId = pathname.match(/\/customer-care\/tickets\/([^/]+)/)?.[1] ?? defaultId;

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("active");
  const [page, setPage] = useState(0);
  const [live, setLive] = useState(true);
  const [sort, setSort] = useState<keyof typeof SORTS>("urgency");
  const searchRef = useRef<HTMLInputElement>(null);

  // Ctrl+K or "/" focuses the omni-search (same shortcut as the sample).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName ?? "").toUpperCase();
      if ((e.ctrlKey && e.key.toLowerCase() === "k") || (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA")) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const q = query.trim().toLowerCase();
  const activeFilter = FILTERS.find((f) => f.key === filter)!;
  // An ID search looks across every ticket, not just the current filter.
  const matched = rows.filter((r) => (q ? r.search.includes(q) : activeFilter.test(r))).sort(SORTS[sort].fn);
  const pages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = matched.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <>
      {/* Command Header & Omni-Search Hub */}
      <CommandBand>
        <div className="w-full relative">
          <div className="flex items-stretch bg-surface-container-lowest rounded shadow-sm">
            <div className="flex items-center px-space-md text-on-surface-variant">
              <Icon name="search" className="text-[22px] text-slate-dark" />
            </div>
            <input
              ref={searchRef}
              autoComplete="off"
              className="w-full py-space-sm font-label-mono text-body-md text-on-surface bg-transparent focus:outline-none placeholder:text-on-surface-variant/60"
              placeholder="Omni-Search by Ticket ID (TKT-8492), Job ID (JOB-8942), Employee ID (EMP-402), Client or Tech... (Press '/' or Ctrl+K)"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
            />
            <div className="hidden md:flex items-center px-space-md gap-space-xs">
              <kbd className="px-space-xs py-0.5 bg-slate-surface rounded text-slate-dark font-label-mono-sm text-label-mono-sm shadow-sm">CTRL+K</kbd>
              <kbd className="px-space-xs py-0.5 bg-slate-surface rounded text-slate-dark font-label-mono-sm text-label-mono-sm shadow-sm">/</kbd>
            </div>
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                className="px-space-md text-slate-dark hover:text-safety-orange transition-colors"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs">
          <div className="flex flex-wrap items-center gap-space-xs">
            {FILTERS.map((f) => {
              const on = !q && f.key === filter;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => {
                    setFilter(f.key);
                    setQuery("");
                    setPage(0);
                  }}
                  className={`px-space-sm py-1 rounded font-label-mono-sm text-label-mono-sm uppercase tracking-wider transition-all ${
                    on ? "bg-safety-orange text-on-primary" : "bg-surface-container-lowest/10 text-primary-fixed-dim hover:text-on-primary"
                  }`}
                >
                  {f.label} ({rows.filter(f.test).length})
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-space-md">
            <label className="flex items-center gap-space-xs cursor-pointer select-none">
              <input checked={live} onChange={(e) => setLive(e.target.checked)} className="w-3.5 h-3.5 accent-safety-orange" type="checkbox" />
              <span className="font-label-mono-sm text-label-mono-sm text-primary-fixed-dim uppercase">Live Progress Feed</span>
            </label>
            <div className="h-3 w-px bg-slate-border/30"></div>
            <span className={`font-label-mono-sm text-label-mono-sm flex items-center gap-1 ${live ? "text-industrial-green-bright" : "text-primary-fixed-dim"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${live ? "bg-industrial-green-bright" : "bg-primary-fixed-dim"}`}></span>
              {live ? "Auto-Sync: 5s" : "Sync Paused"}
            </span>
          </div>
        </div>
      </CommandBand>

      {/* Main Operational Grid: Master-Detail Desk */}
      <div className="w-full max-w-[1440px] mx-auto px-gutter py-space-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* LEFT COLUMN: Ticket Stream */}
          <section className="lg:col-span-5 flex flex-col gap-space-md w-full">
            <div className="bg-surface-container-lowest p-space-md rounded shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <Icon name="tune" className="text-slate-dark text-[20px]" />
                <span className="font-headline-sm text-headline-sm uppercase text-slate-dark">
                  {q ? "Search Results" : activeFilter.key === "closed" ? "Closed tickets" : "Active tickets"}
                </span>
              </div>
              <div className="flex items-center gap-space-xs font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                <span>SORT:</span>
                <select
                  aria-label="Sort tickets"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as keyof typeof SORTS);
                    setPage(0);
                  }}
                  className="bg-surface-container-low text-slate-dark font-label-mono-sm text-label-mono-sm py-1 px-space-xs rounded focus:outline-none"
                >
                  {Object.entries(SORTS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-space-sm">
              {visible.length === 0 && (
                <div className="bg-surface-container-lowest p-space-lg rounded shadow-sm text-center font-label-mono text-label-mono text-on-surface-variant">
                  No tickets match “{query}”.
                </div>
              )}
              {visible.map((r) => {
                const selected = r.id === selectedId;
                return (
                  <Link
                    key={r.id}
                    href={`/customer-care/tickets/${r.id}`}
                    scroll={false}
                    className={`block p-space-md rounded transition-all hover:bg-surface-container-low relative ${
                      selected ? "bg-surface-container-lowest shadow-md" : "bg-surface-container-lowest shadow-sm hover:shadow-md"
                    }`}
                  >
                    {selected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-safety-orange rounded-l"></div>}
                    <div className={`flex items-start justify-between gap-space-xs ${selected ? "pl-space-xs" : ""}`}>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-space-xs flex-wrap">
                          <span className="font-label-mono text-label-mono text-slate-dark font-bold">#{r.id}</span>
                          <span className="px-space-xs py-0.5 rounded bg-surface-container font-label-mono-sm text-label-mono-sm text-slate-dark font-bold">
                            {r.jobId}
                          </span>
                        </div>
                        <h4 className="font-headline-sm text-headline-sm text-slate-dark mt-1 line-clamp-1">{r.title}</h4>
                      </div>
                      <PriorityTag priority={r.priority} />
                    </div>
                    <div className={`mt-space-sm flex items-center justify-between gap-2 text-on-surface-variant font-body-sm text-body-sm ${selected ? "pl-space-xs" : ""}`}>
                      <span className="flex items-center gap-1 font-label-mono text-on-surface min-w-0">
                        <Icon name="factory" className={`text-[16px] ${selected ? "text-safety-orange" : "text-slate-dark"}`} />
                        <span className="truncate">{r.client}</span>
                      </span>
                      <span className={`font-label-mono-sm text-label-mono-sm font-bold shrink-0 ${slaTone[r.slaTone]}`}>{r.slaLabel}</span>
                    </div>
                    <div className={`mt-space-sm ${selected ? "pl-space-xs" : ""}`}>
                      <div className="flex items-center justify-between font-label-mono-sm text-label-mono-sm mb-1 gap-2">
                        <span className="text-on-surface-variant truncate">{r.phaseLabel}</span>
                        <span className="font-bold text-slate-dark">{r.progress}%</span>
                      </div>
                      <div className="w-full bg-surface-container-high h-2 rounded overflow-hidden">
                        <div className={`${barTone[r.barTone]} h-full rounded transition-all duration-500`} style={{ width: `${r.progress}%` }}></div>
                      </div>
                    </div>
                    <div
                      className={`mt-space-sm pt-space-xs flex items-center justify-between text-on-surface-variant font-label-mono-sm text-label-mono-sm ${selected ? "pl-space-xs" : ""}`}
                    >
                      <div className="flex items-center gap-space-xs min-w-0">
                        <Icon name="engineering" className="text-[16px] text-slate-dark" />
                        <span className="truncate">
                          Holder: <strong className="text-slate-dark">{r.lead}</strong>
                        </span>
                      </div>
                      <span className={`font-bold flex items-center gap-1 shrink-0 ${footTone[r.footerTone]}`}>
                        {r.footerTone === "ok" && <span className="w-1.5 h-1.5 rounded-full bg-industrial-green-bright animate-pulse"></span>}
                        {r.footerLabel}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="bg-surface-container-lowest p-space-sm rounded shadow-sm flex items-center justify-between font-label-mono-sm text-label-mono-sm text-on-surface-variant">
              <span>
                Showing {visible.length} of {matched.length} records
              </span>
              <div className="flex items-center gap-space-xs">
                <button
                  type="button"
                  disabled={current === 0}
                  onClick={() => setPage(current - 1)}
                  className="px-space-xs py-1 rounded bg-surface-container hover:bg-surface-container-high text-slate-dark disabled:opacity-50"
                >
                  Prev
                </button>
                {Array.from({ length: pages }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPage(i)}
                    className={`px-space-xs py-1 rounded ${
                      i === current ? "bg-slate-dark text-on-primary font-bold" : "bg-surface-container hover:bg-surface-container-high text-slate-dark"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={current >= pages - 1}
                  onClick={() => setPage(current + 1)}
                  className="px-space-xs py-1 rounded bg-surface-container hover:bg-surface-container-high text-slate-dark disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: the routed dossier page */}
          <section className="lg:col-span-7 flex flex-col gap-space-md w-full">{children}</section>
        </div>
      </div>
    </>
  );
}
