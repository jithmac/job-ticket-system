"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/icon";

const REPORT_TYPES = ["Progress Summary", "Technical Field Report", "Completion Certificate", "Time & Materials Breakdown"];

/** "Documents & Change Authorization" section: bill, report request and support. */
export function DocumentsHub({
  jobId,
  bill,
  contactEmail,
}: {
  jobId: string;
  bill: { invoiceId: string; total: string; due: string } | null;
  contactEmail: string;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(REPORT_TYPES[0]);
  const [email, setEmail] = useState(contactEmail);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  function submit() {
    if (!email.includes("@")) return;
    setSubmitted(`REQ-${jobId.replace("JOB-", "")}-${Math.floor(Date.now() / 1000) % 1000}`);
    setOpen(false);
    setNotes("");
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg space-y-space-md w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
        <div>
          <div className="flex items-center gap-space-xs text-safety-orange font-label-mono-sm text-label-mono-sm uppercase font-bold">
            <Icon name="folder_open" className="text-[16px]" />
            <span>Client Protocol Hub</span>
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface">Documents &amp; Reports</h3>
        </div>
        <div className="text-label-mono-sm font-label-mono-sm text-on-surface-variant">3 ACTIVE WORKFLOW ACTIONS</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
        {bill ? (
          <Link
            href={`/customer/jobs/${jobId}/bill`}
            className="w-full flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low hover:bg-surface text-left transition-colors shadow-sm group"
          >
            <div className="flex items-center gap-space-sm">
              <div className="p-2 rounded bg-safety-orange text-on-primary shrink-0">
                <Icon name="receipt_long" className="text-[20px]" />
              </div>
              <div>
                <div className="font-headline-sm text-headline-sm text-on-surface group-hover:text-safety-orange transition-colors">Print Current Bill</div>
                <div className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                  Invoice #{bill.invoiceId} • {bill.total} • Due {bill.due}
                </div>
              </div>
            </div>
            <Icon name="print" className="text-on-surface-variant group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <div className="w-full flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-low shadow-sm opacity-70">
            <div className="p-2 rounded bg-surface-container text-on-surface-variant shrink-0">
              <Icon name="receipt_long" className="text-[20px]" />
            </div>
            <div>
              <div className="font-headline-sm text-headline-sm text-on-surface">Bill Not Yet Issued</div>
              <div className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">Invoiced at first milestone sign-off</div>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setOpen((o) => !o);
            setSubmitted(null);
          }}
          aria-expanded={open}
          className="w-full flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low hover:bg-surface text-left transition-colors shadow-sm group"
        >
          <div className="flex items-center gap-space-sm">
            <div className="p-2 rounded bg-slate-dark text-on-primary shrink-0">
              <Icon name="assessment" className="text-[20px]" />
            </div>
            <div>
              <div className="font-headline-sm text-headline-sm text-on-surface group-hover:text-slate-dark transition-colors">Request a Report</div>
              <div className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">Progress Dossier • Generated on Demand</div>
            </div>
          </div>
          <Icon name={open ? "expand_less" : "arrow_forward"} className="text-on-surface-variant group-hover:translate-x-1 transition-transform" />
        </button>
        <a
          href={`mailto:care@apexindustrial.com?subject=${encodeURIComponent(`Question about ${jobId}`)}`}
          className="w-full flex items-center justify-between p-space-sm rounded-lg bg-surface-container-low hover:bg-surface text-left transition-colors shadow-sm group"
        >
          <div className="flex items-center gap-space-sm">
            <div className="p-2 rounded bg-industrial-green text-on-primary shrink-0">
              <Icon name="support_agent" className="text-[20px]" />
            </div>
            <div>
              <div className="font-headline-sm text-headline-sm text-on-surface group-hover:text-industrial-green transition-colors">Contact Customer Care</div>
              <div className="font-label-mono-sm text-label-mono-sm text-on-surface-variant">care@apexindustrial.com • 24/7</div>
            </div>
          </div>
          <Icon name="chevron_right" className="text-industrial-green font-bold group-hover:translate-x-1 transition-transform" />
        </a>
      </div>

      {submitted && (
        <div className="p-space-sm rounded-lg bg-surface-container-low shadow-sm flex items-center gap-space-sm">
          <Icon name="task_alt" className="text-industrial-green" />
          <span className="font-body-md text-body-md text-on-surface">
            Report request <span className="font-label-mono text-label-mono font-bold">{submitted}</span> received. Customer care will email your{" "}
            {type.toLowerCase()} to {email} within 24 hours.
          </span>
        </div>
      )}

      {open && (
        <div className="p-space-md rounded-lg bg-surface-container-low shadow-sm grid grid-cols-1 md:grid-cols-3 gap-space-md">
          <label className="flex flex-col gap-space-xs">
            <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant font-bold">Report Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="px-space-sm py-2 rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-safety-orange"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-space-xs">
            <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant font-bold">Deliver To</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-space-sm py-2 rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-safety-orange"
            />
          </label>
          <label className="flex flex-col gap-space-xs md:row-span-2">
            <span className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant font-bold">Notes (optional)</span>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything specific you want covered?"
              className="px-space-sm py-2 rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-safety-orange resize-none placeholder:text-on-surface-variant/60"
            />
          </label>
          <div className="md:col-span-2 flex items-end justify-end gap-space-sm">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-space-md py-2 rounded bg-surface text-on-surface font-label-mono text-label-mono font-bold hover:bg-surface-container-high shadow-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              className="px-space-md py-2 rounded bg-safety-orange hover:bg-safety-orange-bright text-on-primary font-label-mono text-label-mono font-bold shadow-sm flex items-center gap-space-xs"
            >
              <Icon name="send" className="text-[16px]" /> Submit Request
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
