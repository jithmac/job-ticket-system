"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { NavLink } from "@/components/nav-link";

const items = [
  { href: "/customer-care", label: "Ticket Desk", icon: "confirmation_number", exclude: ["/customer-care/employees", "/customer-care/reports"] },
  { href: "/customer-care/employees", label: "Employees", icon: "badge", exclude: [] },
  { href: "/customer-care/reports", label: "Progress Reports", icon: "monitoring", exclude: [] },
];

/** Header navigation. The active style is the one the sample declared in `data-active-classes`. */
export function CareNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <nav className="hidden md:flex items-center gap-space-md h-16">
        {items.map((i) => (
          <NavLink
            key={i.href}
            href={i.href}
            exclude={i.exclude}
            className="h-full flex items-center gap-space-xs px-space-sm font-label-mono text-label-mono uppercase transition-colors"
            activeClassName="bg-slate-dark text-safety-orange-bright border-b-2 border-safety-orange"
            inactiveClassName="text-primary-fixed-dim hover:text-on-primary border-b-2 border-transparent"
          >
            <Icon name={i.icon} className="text-[16px]" />
            {i.label}
          </NavLink>
        ))}
      </nav>
      <button
        type="button"
        className="md:hidden p-space-xs rounded text-primary-fixed-dim hover:text-on-primary"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name={open ? "close" : "menu"} className="text-[22px]" />
      </button>
      {open && (
        <nav className="md:hidden fixed left-0 right-0 top-16 z-40 bg-slate-dark border-b-2 border-safety-orange p-space-sm flex flex-col gap-space-xs shadow-lg">
          {items.map((i) => (
            <NavLink
              key={i.href}
              href={i.href}
              exclude={i.exclude}
              onClick={() => setOpen(false)}
              className="flex items-center gap-space-xs px-space-sm py-space-sm rounded font-label-mono text-label-mono uppercase"
              activeClassName="bg-safety-orange text-on-primary"
              inactiveClassName="text-primary-fixed-dim"
            >
              <Icon name={i.icon} className="text-[16px]" />
              {i.label}
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
}
