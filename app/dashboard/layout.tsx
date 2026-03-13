"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getClinicTheme } from "@/lib/clinic-theme";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [clinicSlug, setClinicSlug] = useState("");

  useEffect(() => {
    const savedClinicSlug =
      localStorage.getItem("siadvoice_clinic_slug") || "";
    setClinicSlug(savedClinicSlug);
  }, []);

  const clinicTheme = useMemo(
    () => getClinicTheme(clinicSlug),
    [clinicSlug]
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-72 bg-slate-950 text-white px-6 py-8 shadow-2xl">
          <div className="mb-10">
            <div className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
              STAGING
            </div>

            <div className="mt-5 flex items-center gap-3">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full border ${clinicTheme.accent.border} ${clinicTheme.accent.soft} text-lg font-bold ${clinicTheme.accent.text}`}
              >
                {clinicTheme.initials}
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  {clinicTheme.displayName}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {clinicTheme.specialty}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-slate-400">
                Panel multi-clínica SIADVOICE
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="rounded-xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
            >
              Dashboard
            </Link>

            <Link
              href="/dashboard/appointments"
              className="rounded-xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
            >
              Citas
            </Link>
          </nav>

          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Clínica activa
            </p>
            <p className="mt-2 text-sm font-medium text-slate-200">
              {clinicTheme.displayName}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {clinicTheme.subtitle}
            </p>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 bg-gradient-to-br from-slate-100 via-slate-50 to-white">
          <div className="min-h-screen p-6 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}