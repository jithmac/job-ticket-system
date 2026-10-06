import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Icon } from "@/components/icon";
import { NavLink } from "@/components/nav-link";
import { currentEmployeeId } from "@/lib/data";
import { getEmployee } from "@/lib/tickets";
import { EmployeeMobileNav } from "./_components/mobile-nav";
import { employeeNav } from "./_components/nav-items";

export const metadata: Metadata = {
  title: { template: "%s | Employee Panel", default: "Employee Panel" },
};

/**
 * Shared shell for every /employee/* route. Next.js keeps this layout mounted
 * while navigating between child pages, so only the <main> content swaps.
 */
export default function EmployeeLayout({ children }: LayoutProps<"/employee">) {
  const me = getEmployee(currentEmployeeId)!;

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col font-body-md">
      {/* Top Header Bar */}
      <header className="border-b-2 border-b-blue-600 border-t-2 border-t-blue-500 sticky top-0 w-full z-50 flex items-center justify-between px-4 md:px-6 h-16 bg-slate-dark text-white">
        <div className="flex items-center gap-4">
          <EmployeeMobileNav />
          <Link href="/employee" className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600"></span>
                <span className="font-headline-md font-bold text-lg leading-tight text-white">Employee Panel</span>
              </div>
              <p className="hidden sm:block text-xs font-label-mono text-slate-border">Manage Job Tickets</p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 pl-3 border-l border-slate-border">
            <Avatar employee={me} size={32} className="rounded border border-slate-border" />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold leading-tight text-white">{me.name}</span>
              <span className="text-[10px] font-label-mono text-industrial-green font-medium uppercase">
                {me.title} • {me.id}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-row">
        {/* Collapsed Icon-Only Navigation Dock (Desktop) */}
        <nav className="border-r border-slate-border fixed left-0 top-16 bottom-0 z-40 w-16 hidden md:flex flex-col justify-between items-center py-4 bg-slate-dark">
          <div className="flex flex-col items-center gap-3 w-full">
            {employeeNav.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                exact={item.exact}
                exclude={item.exclude}
                title={item.label}
                className="dock-link w-10 h-10 rounded flex items-center justify-center transition-colors group relative"
                activeClassName="bg-safety-orange text-white shadow-sm"
                inactiveClassName="text-on-surface-variant hover:text-on-surface hover:bg-slate-100"
              >
                <Icon name={item.icon} className="text-[22px]" />
                <span className="absolute left-full ml-3 px-2 py-1 bg-slate-dark text-white text-xs font-label-mono rounded shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  {item.label}
                </span>
              </NavLink>
            ))}
          </div>
          <div className="flex flex-col items-center">
            <Link
              href="/"
              className="w-10 h-10 rounded border border-slate-border text-on-surface-variant hover:border-safety-orange hover:text-safety-orange flex items-center justify-center transition-colors group relative"
              title="Logout"
            >
              <Icon name="logout" className="text-[20px]" />
              <span className="absolute left-full ml-3 px-2 py-1 bg-slate-dark text-white text-xs font-label-mono rounded shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                Logout
              </span>
            </Link>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 w-full md:ml-16 min-h-[calc(100vh-4rem)] bg-surface">
          <div className="max-w-[1200px] mx-auto p-4 md:p-8 py-8 md:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
