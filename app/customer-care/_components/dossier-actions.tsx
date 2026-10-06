"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";

export function DossierActions() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-space-xs no-print">
      <button
        type="button"
        onClick={() => window.print()}
        className="px-space-sm py-1 rounded bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 font-label-mono-sm text-label-mono-sm text-on-primary transition-all flex items-center gap-1"
      >
        <Icon name="print" className="text-[16px]" /> Print Ticket
      </button>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            /* clipboard unavailable */
          }
        }}
        className="px-space-sm py-1 rounded bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 font-label-mono-sm text-label-mono-sm text-on-primary transition-all flex items-center gap-1"
      >
        <Icon name={copied ? "check" : "share"} className="text-[16px]" /> {copied ? "Link Copied" : "Share Link"}
      </button>
    </div>
  );
}
