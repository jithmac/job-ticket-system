"use client";

import { Icon } from "@/components/icon";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded bg-safety-orange hover:bg-safety-orange-bright text-on-primary font-headline-sm text-headline-sm uppercase tracking-wider transition-colors shadow-sm"
    >
      <Icon name="print" className="text-[20px]" /> Print Bill
    </button>
  );
}
