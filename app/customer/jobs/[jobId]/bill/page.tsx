import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { currentClientId, getTicketsForClient } from "@/lib/db-data";
import { billTotals, formatDate, formatMoney, getClient, getEmployee, getTicketByJobId } from "@/lib/tickets";
import { PrintButton } from "../../../_components/print-button";

export async function generateStaticParams() {
  const tickets = await getTicketsForClient(currentClientId);
  return tickets
    .filter((t) => t.billing)
    .map((t) => ({ jobId: t.jobId }));
}

export async function generateMetadata({ params }: PageProps<"/customer/jobs/[jobId]/bill">): Promise<Metadata> {
  const { jobId } = await params;
  const job = await getTicketByJobId(jobId);
  return { title: job?.billing ? `Invoice ${job.billing.invoiceId}` : "Bill" };
}

export default async function BillPage({ params }: PageProps<"/customer/jobs/[jobId]/bill">) {
  const { jobId } = await params;
  const job = await getTicketByJobId(jobId);
  if (!job || job.clientId !== currentClientId || !job.billing) notFound();

  const client = (await getClient(job.clientId))!;
  const { subtotal, tax, total } = billTotals(job.billing);
  const lead = await getEmployee(job.ownerId);

  return (
    <>
      <div className="no-print flex flex-wrap items-center justify-between gap-space-sm">
        <Link
          href={`/customer/jobs/${job.jobId}`}
          className="inline-flex items-center gap-space-xs font-label-mono text-label-mono uppercase text-on-surface-variant hover:text-safety-orange font-bold"
        >
          <Icon name="arrow_back" className="text-[16px]" /> Back to job
        </Link>
        <PrintButton />
      </div>

      <article className="print-sheet bg-surface-container-lowest rounded-xl shadow-md overflow-hidden max-w-4xl mx-auto w-full">
        <header className="bg-slate-dark text-on-primary p-space-lg flex flex-col sm:flex-row justify-between gap-space-md border-b-2 border-safety-orange">
          <div className="flex items-center gap-space-sm">
            <div className="bg-safety-orange px-space-sm py-space-xs rounded font-headline-sm text-headline-sm uppercase text-on-primary tracking-wider">APEX</div>
            <div>
              <div className="font-headline-sm text-headline-sm uppercase">Apex Heavy Industries</div>
              <div className="font-label-mono-sm text-label-mono-sm text-primary-fixed-dim">880 Industrial Pkwy, Gary IN 46406 • billing@apexindustrial.com</div>
            </div>
          </div>
          <div className="sm:text-right">
            <div className="font-label-mono-sm text-label-mono-sm text-primary-fixed-dim uppercase">Tax Invoice</div>
            <div className="font-headline-md text-headline-md">#{job.billing.invoiceId}</div>
          </div>
        </header>

        <div className="p-space-lg grid grid-cols-1 sm:grid-cols-3 gap-space-md border-b border-slate-border/40">
          <div>
            <div className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">Billed To</div>
            <div className="font-headline-sm text-headline-sm text-slate-dark">{client.name}</div>
            <div className="font-body-sm text-body-sm text-on-surface-variant">{client.contactName}</div>
            <div className="font-body-sm text-body-sm text-on-surface-variant">{client.address}</div>
          </div>
          <div>
            <div className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">Job</div>
            <div className="font-label-mono text-label-mono font-bold text-slate-dark">#{job.jobId}</div>
            <div className="font-body-sm text-body-sm text-on-surface-variant">{job.title}</div>
            <div className="font-body-sm text-body-sm text-on-surface-variant">Lead: {lead?.name}</div>
          </div>
          <div className="sm:text-right">
            <div className="font-label-mono-sm text-label-mono-sm text-on-surface-variant uppercase">Issued / Due</div>
            <div className="font-label-mono text-label-mono text-slate-dark">{formatDate(job.billing.issuedOn)}</div>
            <div className="font-label-mono text-label-mono font-bold text-safety-orange">Due {formatDate(job.billing.dueDate)}</div>
            <div className="font-label-mono-sm text-label-mono-sm text-on-surface-variant mt-1">Contract {client.contractRef}</div>
          </div>
        </div>

        <div className="p-space-lg overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="text-left font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant border-b border-slate-border/60">
                <th className="py-space-sm pr-space-md">Description</th>
                <th className="py-space-sm pr-space-md text-right">Qty</th>
                <th className="py-space-sm pr-space-md text-right">Rate</th>
                <th className="py-space-sm text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-border/30 font-body-md text-body-md">
              {job.billing.lines.map((l) => (
                <tr key={l.description}>
                  <td className="py-space-sm pr-space-md text-on-surface">{l.description}</td>
                  <td className="py-space-sm pr-space-md text-right font-label-mono text-label-mono text-on-surface-variant">
                    {l.qty} {l.unit}
                  </td>
                  <td className="py-space-sm pr-space-md text-right font-label-mono text-label-mono text-on-surface-variant">{formatMoney(l.rate)}</td>
                  <td className="py-space-sm text-right font-label-mono text-label-mono font-bold text-slate-dark">{formatMoney(l.qty * l.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-space-md ml-auto w-full sm:w-72 flex flex-col gap-space-xs font-label-mono text-label-mono">
            <div className="flex justify-between text-on-surface-variant">
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Tax ({Math.round(job.billing.taxRate * 100)}%)</span>
              <span>{formatMoney(tax)}</span>
            </div>
            <div className="flex justify-between items-center pt-space-xs border-t border-slate-border/60">
              <span className="font-bold text-slate-dark uppercase">Total Due</span>
              <span className="font-headline-md text-headline-md text-safety-orange">{formatMoney(total)}</span>
            </div>
          </div>
        </div>

        <footer className="px-space-lg py-space-md bg-surface-container-low font-label-mono-sm text-label-mono-sm text-on-surface-variant flex flex-col sm:flex-row justify-between gap-space-xs">
          <span>Payment terms: Net 30 • Bank transfer reference {job.billing.invoiceId}</span>
          <span>Questions? care@apexindustrial.com • +1 (800) 555-APEX</span>
        </footer>
      </article>
    </>
  );
}
