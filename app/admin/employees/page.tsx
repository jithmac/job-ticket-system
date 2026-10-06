import type { Metadata } from "next";
import { departments, employees, skillLevels, tickets } from "@/lib/data";
import { EmployeeRoster } from "../_components/employee-roster";
import { PageTitle } from "../_components/ui";

export const metadata: Metadata = { title: "Employees / Crew" };

export default function AdminEmployeesPage() {
  const workload: Record<string, number> = {};
  for (const t of tickets) {
    if (t.status === "completed") continue;
    for (const id of new Set([t.ownerId, ...t.participantIds])) workload[id] = (workload[id] ?? 0) + 1;
  }

  return (
    <>
      <PageTitle
        badges={
          <span className="bg-emerald-50 text-industrial-green px-2.5 py-0.5 rounded text-xs font-label-mono font-semibold border border-emerald-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-industrial-green animate-ping"></span>
            {employees.filter((e) => e.status !== "off_duty").length} ON DUTY
          </span>
        }
        title="Employees & Field Crew"
      />
      <EmployeeRoster initial={employees} workload={workload} departments={departments} skillLevels={skillLevels} />
    </>
  );
}
