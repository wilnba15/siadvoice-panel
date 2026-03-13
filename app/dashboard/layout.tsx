import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-72 bg-slate-950 text-white px-6 py-8 shadow-2xl">
          <div className="mb-10">
            <div className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
              STAGING
            </div>

            <h2 className="mt-4 text-2xl font-bold tracking-tight">
              SIADVOICE
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Panel multi-clínica
            </p>
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

            {/* Temporalmente oculto hasta crear la página real */}
            {/*
            <Link
              href="/dashboard/patients"
              className="rounded-xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
            >
              Pacientes
            </Link>
            */}
          </nav>

          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Estado
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Sistema operativo y listo para pruebas por clínica.
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