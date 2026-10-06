import Image from "next/image";
import type { Employee } from "@/lib/types";

/** Profile photo when available, otherwise the initials tile used in the samples. */
export function Avatar({
  employee,
  size = 32,
  className = "",
  fallbackClassName = "bg-slate-dark text-white",
}: {
  employee: Pick<Employee, "name" | "initials" | "avatarUrl">;
  size?: number;
  className?: string;
  fallbackClassName?: string;
}) {
  if (employee.avatarUrl) {
    return (
      <Image
        src={employee.avatarUrl}
        alt={employee.name}
        width={size}
        height={size}
        className={`object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center font-label-mono font-bold shrink-0 ${fallbackClassName} ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size / 3.2)) }}
    >
      {employee.initials}
    </div>
  );
}
