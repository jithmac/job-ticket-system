"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

type NavLinkProps = Omit<ComponentProps<typeof Link>, "href" | "className"> & {
  href: string;
  className?: string;
  activeClassName: string;
  inactiveClassName: string;
  /** Only highlight on an exact match (use for panel index routes like /admin). */
  exact?: boolean;
  /** Sub-paths that belong to a sibling link (e.g. /tickets/new under /tickets). */
  exclude?: string[];
};

/**
 * <Link> that knows whether it points at the current route.
 * Layouts stay mounted across client-side navigations, so this re-renders
 * from usePathname() instead of the whole navigation re-rendering.
 */
export function NavLink({ href, className = "", activeClassName, inactiveClassName, exact, exclude = [], ...rest }: NavLinkProps) {
  const pathname = usePathname();
  const matches = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const active = matches && !exclude.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${className} ${active ? activeClassName : inactiveClassName}`}
      {...rest}
    />
  );
}
