"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Icon } from "@/components/icon";

const roles = {
  admin: {
    label: "Admin Panel",
    description: "Operations leads and system administrators",
    icon: "build",
    destination: "/admin",
  },
  employee: {
    label: "Employee Panel",
    description: "Field engineers and technicians",
    icon: "engineering",
    destination: "/employee",
  },
  "customer-care": {
    label: "Customer Care",
    description: "Dispatch and support desk",
    icon: "support_agent",
    destination: "/customer-care",
  },
} as const;

type Role = keyof typeof roles;

function isRole(value: string | null): value is Role {
  return value !== null && value in roles;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get("role");
  const role: Role = isRole(requestedRole) ? requestedRole : "employee";
  const workspace = roles[role];
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const roleLinks = useMemo(
    () =>
      (Object.keys(roles) as Role[]).filter((item) => item !== role),
    [role],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid work email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);
    void fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, workspace: role }),
    })
      .then(async (response) => {
        const result = (await response.json()) as { destination?: string; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Unable to sign in.");
        router.replace(result.destination ?? workspace.destination);
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Unable to sign in.");
        setIsSubmitting(false);
      });
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl min-h-[620px] grid lg:grid-cols-[0.95fr_1.05fr] bg-surface-container-lowest border border-slate-border rounded-xl shadow-lg overflow-hidden">
        <section className="bg-slate-dark text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-24 -top-20 w-72 h-72 rounded-full bg-safety-orange/15 blur-3xl pointer-events-none" />
          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-2" aria-label="Return to APEX home">
              <span className="bg-safety-orange px-2 py-1 rounded font-headline-sm text-sm uppercase tracking-wider">APEX</span>
              <span className="font-headline-sm text-sm uppercase tracking-tight">Job Tickets</span>
            </Link>
            <div className="mt-20 max-w-sm">
              <div className="w-14 h-14 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center mb-6">
                <Icon name={workspace.icon} className="text-[30px] text-safety-orange" />
              </div>
              <p className="font-label-mono text-[10px] uppercase tracking-[0.18em] text-safety-orange font-bold">Restricted workspace</p>
              <h1 className="font-headline-xl text-4xl leading-tight mt-3">Secure access for {workspace.label}</h1>
              <p className="text-sm text-primary-fixed-dim mt-4 leading-6">{workspace.description}. Use your assigned work credentials to continue.</p>
            </div>
          </div>
          <div className="relative flex items-center gap-2 text-xs text-primary-fixed-dim">
            <Icon name="verified_user" className="text-base text-industrial-green-bright" />
            <span>Credentials are never stored in this browser.</span>
          </div>
        </section>

        <section className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <div className="mb-8">
              <p className="font-label-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant font-bold">Identity verification</p>
              <h2 className="font-headline-xl text-3xl text-on-background mt-2">Sign in to continue</h2>
              <p className="text-sm text-on-surface-variant mt-2">Enter the email and password provided by your administrator.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <div>
                <label htmlFor="email" className="block font-label-mono text-[11px] uppercase tracking-wider font-bold text-on-surface mb-2">Work email</label>
                <div className="relative">
                  <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant" />
                  <input id="email" name="email" type="email" inputMode="email" autoComplete="username" spellCheck={false} required aria-describedby={error ? "login-error" : undefined} className="form-input w-full pl-11 pr-3 py-3 rounded border-slate-border bg-slate-50 text-sm focus:border-safety-orange focus:ring-safety-orange" placeholder="name@company.com" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="font-label-mono text-[11px] uppercase tracking-wider font-bold text-on-surface">Password</label>
                  <span className="font-label-mono text-[10px] text-on-surface-variant">Minimum 8 characters</span>
                </div>
                <div className="relative">
                  <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant" />
                  <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" minLength={8} required className="form-input w-full pl-11 pr-12 py-3 rounded border-slate-border bg-slate-50 text-sm focus:border-safety-orange focus:ring-safety-orange" placeholder="Enter your password" />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-on-surface-variant hover:text-safety-orange" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
                    <Icon name={showPassword ? "visibility_off" : "visibility"} className="text-[20px]" />
                  </button>
                </div>
              </div>

              {error && <p id="login-error" role="alert" className="text-sm text-error flex items-center gap-2"><Icon name="error" className="text-base" />{error}</p>}

              <button type="submit" disabled={isSubmitting} className="w-full py-3 btn-safety rounded text-white font-label-mono text-xs uppercase tracking-wider font-bold shadow hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                {isSubmitting ? "Verifying..." : "Sign in securely"}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-border">
              <p className="font-label-mono text-[10px] uppercase tracking-wider text-on-surface-variant mb-3">Switch workspace</p>
              <div className="flex flex-wrap gap-2">
                {roleLinks.map((item) => (
                  <Link key={item} href={`/login?role=${item}`} className="text-xs border border-slate-border rounded px-3 py-2 text-on-surface-variant hover:text-safety-orange hover:border-safety-orange transition-colors">
                    {roles[item].label}
                  </Link>
                ))}
              </div>
            </div>
            <p className="mt-6 text-center text-xs text-on-surface-variant">Need access? Contact your system administrator.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
