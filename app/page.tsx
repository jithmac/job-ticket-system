import Link from "next/link";
import { Icon } from "@/components/icon";

const panels = [
  {
    href: "/login?role=employee",
    title: "Employee Panel",
    icon: "engineering",
    accent: "bg-blue-600",
    who: "Field engineers & technicians",
    does: ["Create tickets step-by-step", "Update tickets & subtasks", "Pass tickets to crew", "View previous tickets"],
  },
  {
    href: "/login?role=admin",
    title: "Admin Panel",
    icon: "build",
    accent: "bg-safety-orange",
    who: "Operations leads",
    does: ["Add / remove employees", "Clients & jobs", "Progress reports", "Manage ticket crews"],
  },
  {
    href: "/login?role=customer-care",
    title: "Customer Care",
    icon: "support_agent",
    accent: "bg-industrial-green",
    who: "Dispatch & support desk",
    does: ["Search by ticket / employee ID", "Notes visible to employees", "Request priority changes", "Progress & end dates"],
  },
];

export default function Home() {
  return (
    <div className="portal-shell min-h-screen bg-background flex flex-col">
      <header className="bg-slate-dark text-on-primary border-b-2 border-safety-orange">
        <div className="h-16 px-gutter flex items-center gap-space-sm max-w-[1440px] mx-auto">
          <div className="bg-safety-orange px-space-sm py-space-xs rounded font-headline-sm text-headline-sm uppercase tracking-wider">APEX</div>
          <span className="font-headline-sm text-headline-sm uppercase tracking-tight">Job Ticket Management System</span>
        </div>
      </header>
      <section className="bg-slate-dark text-on-primary px-gutter py-space-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-safety-orange/10 blur-3xl pointer-events-none"></div>
        <div className="relative max-w-[1440px] mx-auto">
          <div className="flex items-center gap-space-xs text-safety-orange font-label-mono-sm text-label-mono-sm uppercase font-bold tracking-wider">
            <Icon name="dashboard" className="text-[16px]" /> Select Workspace
          </div>
          <h1 className="font-headline-xl text-headline-xl tracking-tight mt-space-xs">Choose a panel</h1>
          <p className="font-body-md text-body-md text-primary-fixed-dim mt-space-xs max-w-2xl">
            Each panel is a separate section of the app with its own layout and navigation. Sign in to the workspace that matches your role. Customer access is shared through support and does not require an account.
          </p>
        </div>
      </section>
      <main className="flex-1 px-gutter py-space-lg">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
          {panels.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group bg-surface-container-lowest rounded-xl shadow-md p-space-lg flex flex-col gap-space-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className={`w-12 h-12 rounded-lg ${p.accent} text-on-primary flex items-center justify-center shadow-sm`}>
                  <Icon name={p.icon} className="text-[26px]" />
                </span>
                <Icon name="arrow_forward" className="text-on-surface-variant group-hover:text-safety-orange group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">{p.title}</h2>
                <p className="font-label-mono-sm text-label-mono-sm uppercase text-on-surface-variant">{p.who}</p>
              </div>
              <ul className="flex flex-col gap-space-xs">
                {p.does.map((d) => (
                  <li key={d} className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                    <Icon name="check" className="text-[14px] text-industrial-green" /> {d}
                  </li>
                ))}
              </ul>
              <span className="mt-auto font-label-mono text-label-mono text-slate-dark group-hover:text-safety-orange font-bold">{p.href}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
