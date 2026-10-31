"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { addAdminClient, type NewAdminClientInput } from "../actions";

const blank: NewAdminClientInput = {
  name: "",
  facility: "",
  address: "",
  contractRef: "",
  tier: "",
  contactName: "",
  contactRole: "",
  contactEmail: "",
  contactPhone: "",
  accessLevel: "",
  safetyProtocol: "",
};

const fieldCls =
  "form-input w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs font-label-mono text-slate-800 placeholder:text-slate-400 focus:border-safety-orange outline-none";

export function AddClientForm() {
  const [form, setForm] = useState<NewAdminClientInput>(blank);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof NewAdminClientInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage(null);
    setError(null);
  }

  async function submit() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const result = await addAdminClient(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(`${form.name.trim()} added as ${result.clientId}. Client details are now available across the workspace.`);
      setForm(blank);
    } catch {
      setError("Unable to reach the client service. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <details id="add-client" className="mb-6 bg-white border border-slate-200 rounded shadow-sm scroll-mt-24">
      <summary className="cursor-pointer list-none p-4 flex items-center justify-between gap-3 hover:bg-slate-50">
        <span className="flex items-center gap-2 text-sm font-headline-md font-bold text-slate-900">
          <Icon name="person_add" className="text-safety-orange text-lg" /> Add Client
        </span>
        <span className="text-xs font-label-mono text-slate-500">Create a client account and contact record</span>
      </summary>
      <div className="border-t border-slate-100 p-4 space-y-3">
        <p className="text-xs text-slate-600 font-body-sm">
          Add the facility and direct contact details employees and customer care need for calls, messages, and email.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input className={fieldCls} placeholder="Client / company name" value={form.name} onChange={(e) => update("name", e.target.value)} />
          <input className={fieldCls} placeholder="Facility name" value={form.facility} onChange={(e) => update("facility", e.target.value)} />
          <input className={fieldCls} placeholder="Facility address" value={form.address} onChange={(e) => update("address", e.target.value)} />
          <input className={fieldCls} placeholder="Contract reference" value={form.contractRef} onChange={(e) => update("contractRef", e.target.value)} />
          <select className={fieldCls} value={form.tier} onChange={(e) => update("tier", e.target.value)}>
            <option value="">Service tier...</option>
            <option>Standard</option>
            <option>Priority</option>
            <option>Enterprise</option>
          </select>
          <input className={fieldCls} placeholder="Site access level" value={form.accessLevel} onChange={(e) => update("accessLevel", e.target.value)} />
          <input className={fieldCls} placeholder="Primary contact name" value={form.contactName} onChange={(e) => update("contactName", e.target.value)} />
          <input className={fieldCls} placeholder="Contact role" value={form.contactRole} onChange={(e) => update("contactRole", e.target.value)} />
          <input className={fieldCls} placeholder="Contact email" type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} />
          <input className={fieldCls} placeholder="Contact phone for calls and messages" type="tel" value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} />
          <input className={`${fieldCls} md:col-span-2`} placeholder="Safety protocol" value={form.safetyProtocol} onChange={(e) => update("safetyProtocol", e.target.value)} />
        </div>
        {error && (
          <p className="text-[11px] font-label-mono text-error flex items-center gap-1">
            <Icon name="error" className="text-xs" /> {error}
          </p>
        )}
        {message && (
          <p className="text-[11px] font-label-mono text-industrial-green flex items-center gap-1">
            <Icon name="check_circle" className="text-xs" /> {message}
          </p>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="bg-safety-orange hover:bg-safety-orange-bright disabled:opacity-60 text-white py-2 px-4 rounded text-xs font-label-mono font-bold"
        >
          {saving ? "Adding client..." : "Add client account"}
        </button>
      </div>
    </details>
  );
}
