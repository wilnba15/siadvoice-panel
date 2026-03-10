import Link from "next/link"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6 space-y-4">
        <h2 className="text-xl font-bold">SIADVOICE</h2>

        <nav className="flex flex-col space-y-2 mt-6">
          <Link href="/dashboard" className="hover:text-blue-400">
            Dashboard
          </Link>
          <Link href="/dashboard/appointments" className="hover:text-blue-400">
            Citas
          </Link>
          <Link href="/dashboard/patients" className="hover:text-blue-400">
            Pacientes
          </Link>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-10 bg-gray-100">
        {children}
      </main>
    </div>
  )
}
