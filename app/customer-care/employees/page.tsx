import type { Metadata } from "next";
import { getEmployees, getTickets } from "@/lib/db-data";
import { formatDate } from "@/lib/tickets";
import { EmployeeDirectory, type DirectoryEntry } from "../_components/employee-directory";

export const metadata: Metadata = { title: "Employees" };

export default async function CareEmployeesPage() {
  const [employees, tickets] = await Promise.all([getEmployees(), getTickets()]);
  const entries: DirectoryEntry[] = employees.map((employee) => ({
    employee,
    tickets: tickets
      .filter((t) => t.status !== "completed" && (t.ownerId === employee.id || t.participantIds.includes(employee.id)))
      .map((t) => ({ id: t.id, title: t.title, holder: t.ownerId === employee.id, endDate: formatDate(t.endDate) })),
  }));

  return <EmployeeDirectory entries={entries} />;
}
