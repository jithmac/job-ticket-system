"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import type { Employee } from "@/lib/types";

export interface NewEmployeeInput {
  name: string;
  department: string;
  skillLevel: string;
  title: string;
  email: string;
  password: string;
  phone: string;
}

const blank: NewEmployeeInput = { name: "", department: "", skillLevel: "", title: "", email: "", password: "", phone: "" };

const fieldCls =
  "form-input w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs font-label-mono text-slate-800 placeholder:text-slate-400 focus:border-safety-orange outline-none";
const selectCls =
  "form-select bg-slate-50 border border-slate-200 rounded pl-2 pr-8 py-2 text-xs font-label-mono text-slate-800 focus:border-safety-orange outline-none";

/** "Admin: Add Employee" card from the admin sample. */
export function AddEmployeeForm({
  activeCount,
  departments,
  skillLevels,
  onAdd,
}: {
  activeCount: number;
  departments: readonly string[];
  skillLevels: readonly string[];
  onAdd?: (employee: Employee) => void;
}) {
  const [form, setForm] = useState<NewEmployeeInput>(blank);
  const [added, setAdded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(activeCount);

  async function submit() {
    setError(null);
    const response = await fetch("/api/admin/employees", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = (await response.json()) as { employee?: Employee; error?: string };
    if (!response.ok || !result.employee) {
      setError(result.error ?? "Unable to create employee.");
      return;
    }
    onAdd?.(result.employee);
    setCount((c) => c + 1);
    setAdded(`${result.employee.name} registered as ${result.employee.id}.`);
    setForm(blank);
  }

  return (
    <section id="add-employee" className="bg-white border border-slate-200 rounded p-5 flex flex-col gap-3 shadow-sm scroll-mt-24">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5">
          <Icon name="person_add" className="text-slate-700 text-base" />
          <h3 className="text-xs font-label-mono uppercase tracking-wider text-slate-800 font-bold">Admin: Add Employee</h3>
        </div>
        <span className="text-[10px] font-label-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 font-semibold">
          {count} Active
        </span>
      </div>
      <p className="text-xs font-body-sm text-slate-600">
        Deploy or invite a new technician, field engineer, or manager to the operations roster.
      </p>
      <div className="space-y-2 pt-1">
        <input
          className={fieldCls}
          placeholder="Employee Full Name (e.g. Liam Zhang)"
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className={fieldCls}
          placeholder="Temporary password (12+ chars, upper/lower/number)"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <select className={selectCls} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
            <option value="">Department...</option>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select className={selectCls} value={form.skillLevel} onChange={(e) => setForm({ ...form, skillLevel: e.target.value })}>
            <option value="">Skill Level...</option>
            {skillLevels.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <input
          className={fieldCls}
          placeholder="Job Title (e.g. Field Technician)"
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className={fieldCls}
            placeholder="corporate-email@apex-infra.com"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className={fieldCls}
            placeholder="(312) 555-0100"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        {error && (
          <p className="text-[11px] font-label-mono text-error flex items-center gap-1">
            <Icon name="error" className="text-xs" /> {error}
          </p>
        )}
        {added && !error && (
          <p className="text-[11px] font-label-mono text-industrial-green flex items-center gap-1">
            <Icon name="check_circle" className="text-xs" /> {added}
          </p>
        )}
        <button
          type="button"
          onClick={submit}
          className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 py-2 px-3 rounded text-xs font-label-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Icon name="how_to_reg" className="text-sm text-safety-orange" /> Register &amp; Dispatch Member
        </button>
      </div>
    </section>
  );
}
