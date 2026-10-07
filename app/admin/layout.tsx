import type { Metadata } from "next";
import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { NavLink } from "@/components/nav-link";
import { getAdminUser } from "@/lib/db-data";
import { requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { AdminMobileNav } from "./_components/mobile-nav";
import { adminNav } from "./_components/nav-items";

export const metadata: Metadata = {
  title: { template: "%s | Admin Panel", default: "Admin Panel" },
};

/** Shell for every /admin/* route: top nav bar + collapsed icon dock (from the admin sample). */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireRole([UserRole.ADMIN]);
  const adminUser = await getAdminUser();
  return (
    <div className="bg-[#F1F5F9] text-on-surface font-body-md min-h-screen">
      {/* TopNavBar with Industrial Branding & Controls */}
      <header className="bg-slate-dark text-white border-b border-slate-700/80 fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-6 h-16 shadow-sm">
        <div className="flex items-center gap-6">
          <AdminMobileNav />
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-safety-orange flex items-center justify-center text-white shadow-inner">
              <Icon name="build" className="text-lg" />
            </div>
            <div className="flex flex-col">
              <div className="text-sm font-bold font-headline-md tracking-wider uppercase text-white flex items-center gap-1.5">
                Admin Panel{" "}
                <span className="bg-slate-800 text-[10px] text-safety-orange-bright font-label-mono px-1.5 py-0.5 rounded border border-safety-orange/30">
                  OPS-v2
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-label-mono-sm tracking-tight">Industrial Field Operations</div>
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-1 text-xs font-label-mono ml-4">
            {adminNav.slice(1).map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                exact={item.exact}
                className="px-3 py-1.5 rounded flex items-center gap-1.5 border"
                activeClassName="bg-slate-800 text-safety-orange border-safety-orange/30 font-semibold"
                inactiveClassName="border-transparent text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <Icon name={item.icon} className="text-sm" /> {item.short}
              </NavLink>
            ))}
          </nav>
        </div>
        {/* Global search: a GET form that client-side navigates to /admin/tickets?q=... */}
        <Form action="/admin/tickets" className="flex-1 max-w-sm mx-4 hidden md:flex">
          <div className="relative w-full">
            <Icon name="search" className="absolute left-3 top-2.5 text-slate-400 text-sm" />
            <input
              name="q"
              className="w-full pl-9 pr-4 py-1.5 bg-slate-800/90 border border-slate-700 rounded text-xs font-label-mono text-slate-200 placeholder:text-slate-400 focus:border-safety-orange focus:ring-1 focus:ring-safety-orange outline-none transition-colors"
              placeholder="Search tickets, crew, clients..."
              type="search"
            />
          </div>
        </Form>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 mr-1 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-label-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-industrial-green-bright animate-pulse"></span> SYS_NORMAL
          </div>
          <button
            className="p-2 hover:bg-slate-800 transition-colors rounded text-slate-300 hover:text-white flex items-center justify-center relative"
            title="Notifications"
          >
            <Icon name="notifications" className="text-[20px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-safety-orange"></span>
          </button>
          <div className="h-6 w-[1px] bg-slate-700 mx-1"></div>
          <Link href="/" className="flex items-center gap-2 pl-1 cursor-pointer group" title="Switch panel">
            <Image
              className="w-8 h-8 rounded border border-slate-600 object-cover"
              src={adminUser.avatarUrl}
              alt={adminUser.name}
              width={32}
              height={32}
            />
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight">{adminUser.name}</span>
              <span className="text-[10px] text-slate-400 font-label-mono">{adminUser.role}</span>
            </div>
            <Icon name="expand_more" className="text-slate-400 text-sm group-hover:text-white transition-colors" />
          </Link>
        </div>
      </header>

      {/* Collapsed Icon-Only Dock Sidebar */}
      <nav
        aria-label="Quick Navigation"
        className="bg-slate-dark text-slate-400 h-screen w-16 hidden md:flex flex-col items-center border-r border-slate-800 fixed left-0 top-0 z-40 pt-20 pb-4 shadow-sm"
      >
        <div className="flex flex-col items-center gap-3 w-full px-2">
          <Link
            href="/admin/employees#add-employee"
            className="w-10 h-10 bg-safety-orange hover:bg-safety-orange-bright text-white rounded flex items-center justify-center transition-all shadow-sm mb-3"
            title="Add Employee"
          >
            <Icon name="person_add" className="text-lg" />
          </Link>
          <div className="w-8 h-[1px] bg-slate-800 mb-1"></div>
          {adminNav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              exact={item.exact}
              title={item.label}
              className="dock-link w-10 h-10 rounded flex items-center justify-center transition-colors"
              activeClassName="bg-slate-800/80 text-safety-orange border-l-2 border-safety-orange hover:bg-slate-800"
              inactiveClassName="text-slate-400 hover:text-white hover:bg-slate-800/60"
            >
              <Icon name={item.icon} className="text-[20px]" />
            </NavLink>
          ))}
        </div>
        <div className="mt-auto flex flex-col items-center gap-2 w-full px-2">
          <Link
            href="/api/auth/logout"
            className="w-10 h-10 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title="Logout"
          >
            <Icon name="logout" className="text-[20px]" />
          </Link>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="pt-16 md:pl-16">
        <div className="max-w-[1300px] mx-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
