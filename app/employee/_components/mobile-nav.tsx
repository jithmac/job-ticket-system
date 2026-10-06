"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { NavLink } from "@/components/nav-link";
import { employeeNav } from "./nav-items";

/** Hamburger + slide-down menu for small screens (the icon dock is desktop only). */
export function EmployeeMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="md:hidden text-on-surface-variant hover:text-on-surface"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name={open ? "close" : "menu"} className="text-white" />
      </button>
      {open && (
        <nav className="md:hidden fixed left-0 right-0 top-16 z-40 bg-slate-dark border-b border-slate-border shadow-lg p-3 flex flex-col gap-1">
          {employeeNav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              exact={item.exact}
              exclude={item.exclude}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded font-label-mono text-xs uppercase tracking-wider font-semibold transition-colors"
              activeClassName="bg-safety-orange text-white"
              inactiveClassName="text-slate-border hover:bg-slate-800"
            >
              <Icon name={item.icon} className="text-[20px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
}
