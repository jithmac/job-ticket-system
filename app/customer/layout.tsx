import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { NavLink } from "@/components/nav-link";
import { careAgent, currentClientId } from "@/lib/data";
import { getClient } from "@/lib/tickets";

export const metadata: Metadata = {
  title: { template: "%s | Customer Portal", default: "Customer Portal" },
};

/** Shell for every /customer/* route (header, status sub-bar and footer from the customer sample). */
export default function CustomerLayout({ children }: LayoutProps<"/customer">) {
  const client = getClient(currentClientId)!;

  return (
    <div className="portal-shell font-body-md text-on-surface bg-[#eff4fa] min-h-screen flex flex-col">
      <header className="no-print fixed top-0 w-full z-50 bg-slate-dark text-on-primary border-b-2 border-safety-orange">
        <div className="h-16 w-full px-gutter flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-lg">
            <Link href="/customer" className="flex items-center gap-space-sm">
              <div className="bg-safety-orange px-space-sm py-space-xs rounded font-headline-sm text-headline-sm uppercase text-on-primary tracking-wider">
                APEX
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm uppercase tracking-tight text-on-primary">Customer Portal</span>
              </div>
            </Link>
            <div className="hidden lg:flex items-center gap-space-xs px-space-sm py-space-xs bg-slate-dark rounded border border-slate-border/30">
              <span className="w-2 h-2 rounded-full bg-industrial-green-bright animate-pulse"></span>
              <span className="font-label-mono text-label-mono text-on-primary font-bold">#{client.id}</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-space-md h-16">
            <NavLink
              href="/customer"
              className="h-full flex items-center gap-space-xs px-space-sm font-label-mono text-label-mono uppercase transition-colors"
              activeClassName="bg-slate-dark text-safety-orange-bright border-b-2 border-safety-orange"
              inactiveClassName="text-primary-fixed-dim hover:text-on-primary border-b-2 border-transparent"
            >
              <Icon name="engineering" className="text-[16px]" /> Your Jobs
            </NavLink>
          </nav>
          <div className="flex items-center gap-space-md">
            <button
              className="relative p-space-xs rounded hover:bg-slate-dark text-primary-fixed-dim hover:text-on-primary transition-colors"
              type="button"
              title="Notifications"
            >
              <Icon name="notifications" className="text-[20px]" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-safety-orange"></span>
            </button>
            <a
              href={`mailto:care@apexindustrial.com?subject=${encodeURIComponent(`Support request — ${client.name}`)}`}
              className="hidden sm:inline-flex items-center gap-space-xs px-space-sm py-1.5 rounded bg-surface-container-low hover:bg-surface text-slate-dark border border-slate-border/40 hover:border-safety-orange font-label-mono text-label-mono font-semibold transition-colors shadow-sm"
            >
              <Icon name="support_agent" className="text-safety-orange text-[18px]" />
              <span>Contact Support</span>
            </a>
            <Link
              href="/"
              title={`${client.contactName} — switch panel`}
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center border border-slate-border/40"
            >
              <Icon name="person" className="text-on-primary text-[18px]" />
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full pt-16 bg-background flex-1">
        <div className="flex flex-col w-full">
          {/* Operational Breadcrumb / Global Status Sub-bar */}
          <div className="no-print w-full bg-slate-dark text-on-primary px-gutter py-space-sm shadow-md flex flex-wrap items-center justify-between gap-space-sm">
            <span className="font-label-mono-sm text-label-mono-sm uppercase text-primary-fixed-dim">
              Signed in as <span className="text-on-primary font-bold">{client.contactName}</span> • {client.name}
            </span>
            <span className="font-label-mono-sm text-label-mono-sm uppercase text-primary-fixed-dim">
              Care desk: {careAgent.name} ({careAgent.id})
            </span>
          </div>
          <div className="w-full px-gutter py-space-lg space-y-space-lg max-w-[1440px] mx-auto">{children}</div>
        </div>
      </main>

      <footer className="no-print w-full bg-slate-dark text-on-primary border-t border-slate-border/20 py-space-lg">
        <div className="w-full px-gutter flex flex-col md:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <span className="font-headline-sm text-headline-sm uppercase text-safety-orange-bright">APEX INDUSTRIAL</span>
            <span className="font-label-mono-sm text-label-mono-sm text-primary-fixed-dim">SECURE CLIENT TERMINAL v4.2.0</span>
          </div>
          <div className="flex items-center gap-space-lg">
            <a className="font-label-mono-sm text-label-mono-sm text-primary-fixed-dim hover:text-on-primary uppercase transition-colors" href="tel:18005552739">
              Emergency Dispatch
            </a>
            <Link className="font-label-mono-sm text-label-mono-sm text-primary-fixed-dim hover:text-on-primary uppercase transition-colors" href="/customer">
              Your Jobs
            </Link>
          </div>
          <div className="font-label-mono-sm text-label-mono-sm text-primary-fixed-dim uppercase">© 2026 Apex Heavy Industries. Precision &amp; Power.</div>
        </div>
      </footer>
    </div>
  );
}
