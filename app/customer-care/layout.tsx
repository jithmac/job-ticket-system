import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { getCareAgent } from "@/lib/db-data";
import { CareNav } from "./_components/care-nav";

export const metadata: Metadata = {
  title: { template: "%s | Customer Care", default: "Customer Care" },
};

/** Shell for every /customer-care/* route (header + footer from the customer-care sample). */
export default async function CustomerCareLayout({ children }: LayoutProps<"/customer-care">) {
  const careAgent = await getCareAgent();
  return (
    <div className="portal-shell font-body-md text-on-surface bg-[#eff4fa] min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-50 bg-slate-dark text-on-primary border-b-2 border-safety-orange">
        <div className="h-16 w-full px-gutter flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-lg">
            <Link href="/customer-care" className="flex items-center gap-space-sm">
              <div className="bg-safety-orange px-space-sm py-space-xs rounded font-headline-sm text-headline-sm uppercase text-on-primary tracking-wider">
                APEX
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm uppercase tracking-tight text-on-primary">Customer care Portal</span>
              </div>
            </Link>
            <div className="hidden lg:flex items-center gap-space-xs px-space-sm py-space-xs bg-slate-dark rounded border border-slate-border/30">
              <span className="w-2 h-2 rounded-full bg-industrial-green-bright animate-pulse"></span>
              <span className="font-label-mono text-label-mono text-on-primary font-bold">#{careAgent.id}</span>
            </div>
          </div>
          <CareNav />
          <div className="flex items-center gap-space-md">
            <button
              className="relative p-space-xs rounded hover:bg-slate-dark text-primary-fixed-dim hover:text-on-primary transition-colors"
              type="button"
              title="Notifications"
            >
              <Icon name="notifications" className="text-[20px]" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-safety-orange"></span>
            </button>
            <Link
              href="/"
              title={`${careAgent.name} — switch panel`}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center border border-slate-border/40"
            >
              <Icon name="person" className="text-on-primary text-[18px]" />
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full pt-16 bg-background flex-1">
        <div className="flex flex-col w-full">{children}</div>
      </main>

      <footer className="w-full bg-slate-dark text-on-primary border-t border-slate-border/20 py-space-lg">
        <div className="w-full px-gutter flex flex-col md:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <span className="font-headline-sm text-headline-sm uppercase text-safety-orange-bright">APEX INDUSTRIAL</span>
            <span className="font-label-mono-sm text-label-mono-sm text-primary-fixed-dim">CUSTOMER CARE TERMINAL v4.2.0</span>
          </div>
          <div className="flex items-center gap-space-lg">
            <span className="font-label-mono-sm text-label-mono-sm text-primary-fixed-dim uppercase">
              Agent: {careAgent.name} ({careAgent.id})
            </span>
          </div>
          <div className="font-label-mono-sm text-label-mono-sm text-primary-fixed-dim uppercase">
            © 2026 Apex Heavy Industries. Precision &amp; Power.
          </div>
        </div>
      </footer>
    </div>
  );
}
