import Link from "next/link";
import { Icon } from "@/components/icon";

/** Rendered for unknown URLs and whenever a page calls notFound() (e.g. an unknown ticket ID). */
export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-space-lg">
      <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg max-w-md w-full text-center flex flex-col items-center gap-space-sm">
        <span className="w-14 h-14 rounded-lg bg-slate-dark text-safety-orange flex items-center justify-center">
          <Icon name="search_off" className="text-[30px]" />
        </span>
        <h1 className="font-headline-md text-headline-md text-on-surface">Record not found</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">That ticket, job or page doesn’t exist, or you don’t have access to it.</p>
        <Link
          href="/"
          className="mt-space-xs px-space-md py-space-sm rounded bg-safety-orange hover:bg-safety-orange-bright text-on-primary font-label-mono text-label-mono font-bold"
        >
          Back to panels
        </Link>
      </div>
    </div>
  );
}
