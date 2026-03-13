"use client";

import { useEffect, useMemo, useState } from "react";

type Appointment = {
  id?: string | number;
  patient_name?: string;
  patient_phone?: string;
  date?: string;
  time?: string;
  status?: string;
};

const API = process.env.NEXT_PUBLIC_API_BASE;

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfWeekISO() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function translateStatus(status?: string) {
  if (status === "scheduled") return "Programada";
  if (status === "canceled") return "Cancelada";
  if (status === "completed") return "Completada";
  return status || "Sin estado";
}

function statusClasses(status?: string) {
  if (status === "scheduled") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "canceled") {
    return "border border-rose-200 bg-rose-50 text-rose-700";
  }
  if (status === "completed") {
    return "border border-sky-200 bg-sky-50 text-sky-700";
  }
  return "border border-slate-200 bg-slate-50 text-slate-700";
}

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clinicSlug, setClinicSlug] = useState<string>("");

  const TODAY = todayISO();
  const WEEK_START = startOfWeekISO();

  useEffect(() => {
    const token = localStorage.getItem("siadvoice_token");
    const savedClinicSlug = localStorage.getItem("siadvoice_clinic_slug") || "";

    setClinicSlug(savedClinicSlug);

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (!API) {
      setError("Falta NEXT_PUBLIC_API_BASE en .env.local");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const headers: HeadersInit = {
          Authorization: `Bearer ${token}`,
        };

        if (savedClinicSlug) {
          headers["X-Clinic-Slug"] = savedClinicSlug;
        }

        const res = await fetch(`${API}/appointments`, {
          method: "GET",
          headers,
          cache: "no-store",
        });

        if (res.status === 401) {
          localStorage.removeItem("siadvoice_token");
          window.location.href = "/login";
          return;
        }

        if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);

        const data = await res.json();
        setAppointments(Array.isArray(data) ? data : (data.items ?? []));
      } catch (e: any) {
        setError(e?.message ?? "Error cargando datos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metrics = useMemo(() => {
    const total = appointments.length;
    const today = appointments.filter((a) => a.date === TODAY).length;
    const week = appointments.filter((a) => (a.date ?? "") >= WEEK_START).length;
    return { total, today, week };
  }, [appointments, TODAY, WEEK_START]);

  const last = useMemo(() => {
    const sorted = [...appointments].sort((a, b) => {
      const da = `${a.date ?? ""} ${a.time ?? ""}`.trim();
      const db = `${b.date ?? ""} ${b.time ?? ""}`.trim();
      return db.localeCompare(da);
    });
    return sorted.slice(0, 5);
  }, [appointments]);

  const handleLogout = () => {
    localStorage.removeItem("siadvoice_token");
    localStorage.removeItem("siadvoice_clinic_slug");
    window.location.href = "/login";
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
              Panel principal
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              Dashboard SIADVOICE
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Resumen general del sistema de citas y actividad reciente.
            </p>

            {clinicSlug && (
              <p className="mt-4 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                Clínica activa: {clinicSlug}
              </p>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Cerrar sesión
          </button>
        </div>
      </section>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-slate-600">Cargando datos...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Citas hoy</p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                {metrics.today}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Citas programadas para la fecha actual.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Citas esta semana
              </p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                {metrics.week}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Actividad acumulada desde el inicio de semana.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total de citas
              </p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
                {metrics.total}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Registros disponibles en la clínica activa.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Últimas citas
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Vista rápida de los registros más recientes.
                </p>
              </div>

              <a
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                href="/dashboard/appointments"
              >
                Ver todas
              </a>
            </div>

            {appointments.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
                No hay citas registradas.
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-slate-600">
                      <th className="px-4 py-3 font-semibold">Paciente</th>
                      <th className="px-4 py-3 font-semibold">Teléfono</th>
                      <th className="px-4 py-3 font-semibold">Fecha</th>
                      <th className="px-4 py-3 font-semibold">Hora</th>
                      <th className="px-4 py-3 font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {last.map((a, idx) => (
                      <tr
                        key={String(a.id ?? idx)}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-4 font-medium text-slate-900">
                          {a.patient_name ?? "-"}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {a.patient_phone ?? "-"}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {a.date ?? "-"}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {a.time ?? "-"}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                              a.status
                            )}`}
                          >
                            {translateStatus(a.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}