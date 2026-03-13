"use client";

import { useEffect, useMemo, useState } from "react";

type Appointment = {
  id?: string | number;
  patient_name?: string;
  patient_phone?: string;
  date?: string; // "YYYY-MM-DD"
  time?: string; // "HH:MM"
  status?: string; // "scheduled" | "canceled" | etc
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
  // semana empieza lunes
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // lunes=0 ... domingo=6
  d.setDate(d.getDate() - day);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const TODAY = todayISO();
  const WEEK_START = startOfWeekISO();

  useEffect(() => {
    if (!API) {
      setError("Falta NEXT_PUBLIC_API_BASE en .env.local");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // usa el mismo endpoint que citas (si tu backend lo expone así)
        const res = await fetch(`${API}/appointments`, { cache: "no-store" });
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
    const today = appointments.filter(a => a.date === TODAY).length;
    const week = appointments.filter(a => (a.date ?? "") >= WEEK_START).length;
    return { total, today, week };
  }, [appointments, TODAY, WEEK_START]);

  const last = useMemo(() => {
    // ordena por fecha+hora desc (si vienen como strings)
    const sorted = [...appointments].sort((a, b) => {
      const da = `${a.date ?? ""} ${a.time ?? ""}`.trim();
      const db = `${b.date ?? ""} ${b.time ?? ""}`.trim();
      return db.localeCompare(da);
    });
    return sorted.slice(0, 5);
  }, [appointments]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Dashboard SIADVOICE</h1>
      <p className="mt-2 text-gray-600">Resumen general del sistema.</p>

      {loading && <p className="mt-6">Cargando datos...</p>}

      {!loading && error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-gray-500">Citas hoy</p>
              <p className="mt-2 text-3xl font-semibold">{metrics.today}</p>
            </div>
            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-gray-500">Citas esta semana</p>
              <p className="mt-2 text-3xl font-semibold">{metrics.week}</p>
            </div>
            <div className="rounded-xl border bg-white p-5">
              <p className="text-sm text-gray-500">Total de citas</p>
              <p className="mt-2 text-3xl font-semibold">{metrics.total}</p>
            </div>
          </div>

          <div className="mt-8 rounded-xl border bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Últimas citas</h2>
              <a className="text-sm underline" href="/dashboard/appointments">
                Ver todas
              </a>
            </div>

            {appointments.length === 0 ? (
              <p className="mt-4 text-gray-600">No hay citas registradas.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="border p-2">Paciente</th>
                      <th className="border p-2">Teléfono</th>
                      <th className="border p-2">Fecha</th>
                      <th className="border p-2">Hora</th>
                      <th className="border p-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {last.map((a, idx) => (
                      <tr key={String(a.id ?? idx)}>
                        <td className="border p-2">{a.patient_name ?? "-"}</td>
                        <td className="border p-2">{a.patient_phone ?? "-"}</td>
                        <td className="border p-2">{a.date ?? "-"}</td>
                        <td className="border p-2">{a.time ?? "-"}</td>
                        
                        <td className="border p-2">
                          {a.status === "scheduled" && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm">
                              Programada
                            </span>
                          )}

                          {a.status === "canceled" && (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm">
                              Cancelada
                            </span>
                          )}

                          {!a.status && "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}