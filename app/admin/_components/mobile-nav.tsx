"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { NavLink } from "@/components/nav-link";
import { adminNav } from "./nav-items";

/** Menu for screens where the top nav (lg+) and dock (md+) are hidden. */
export function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="p-2 hover:bg-slate-800 transition-colors rounded text-slate-300 hover:text-white flex items-center justify-center"
      >
        <Icon name={open ? "close" : "menu"} className="text-[20px]" />
      </button>
      {open && (
        <nav className="fixed left-0 right-0 top-16 z-40 bg-slate-dark border-b border-slate-700 shadow-lg p-3 flex flex-col gap-1">
          {adminNav.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              exact={item.exact}
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded text-xs font-label-mono flex items-center gap-2 border"
              activeClassName="bg-slate-800 text-safety-orange border-safety-orange/30 font-semibold"
              inactiveClassName="text-slate-300 border-transparent hover:text-white hover:bg-slate-800/60"
            >
              <Icon name={item.icon} className="text-sm" /> {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
