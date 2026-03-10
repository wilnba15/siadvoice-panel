"use client";

import { useEffect, useMemo, useState } from "react";

type Appointment = {
  id: number;
  patient_name: string;
  phone: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  status: string;
};

type FilterMode = "today" | "week" | "all";

function statusToSpanish(status: string) {
  const s = (status || "").toLowerCase().trim();
  if (s === "scheduled") return "Programada";
  if (s === "cancelled" || s === "canceled") return "Cancelada";
  if (s === "completed") return "Completada";
  if (s === "no_show" || s === "noshow") return "No asistió";
  if (s === "pending") return "Pendiente";
  return status || "—";
}

function statusStyles(statusEs: string) {
  if (statusEs === "Programada")
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (statusEs === "Cancelada")
    return "bg-rose-100 text-rose-800 border-rose-200";
  if (statusEs === "Completada")
    return "bg-blue-100 text-blue-800 border-blue-200";
  if (statusEs === "Pendiente")
    return "bg-amber-100 text-amber-800 border-amber-200";
  if (statusEs === "No asistió")
    return "bg-slate-100 text-slate-800 border-slate-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
}

// Helpers fecha (sin libs)
function toDateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function parseISODate(iso: string) {
  // iso: YYYY-MM-DD
  const [y, m, d] = (iso || "").split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function startOfWeekMonday(d: Date) {
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day; // Monday as start
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return toDateOnly(monday);
}
function endOfWeekSunday(d: Date) {
  const monday = startOfWeekMonday(d);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return toDateOnly(sunday);
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [filter, setFilter] = useState<FilterMode>("all");

  useEffect(() => {
    setLoading(true);
    setError("");

    fetch("https://cataratas-voice-backend-staging.onrender.com/appointments")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar la lista de citas.");
        return res.json();
      })
      .then((data) => setAppointments(Array.isArray(data) ? data : []))
      .catch((e) => setError(e?.message || "Error cargando citas"))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    const mapped = appointments.map((a) => {
      const statusEs = statusToSpanish(a.status);
      return { ...a, statusEs, dateObj: parseISODate(a.date) as Date };
    });

    const today = toDateOnly(new Date());
    const weekStart = startOfWeekMonday(today);
    const weekEnd = endOfWeekSunday(today);

    const filtered = mapped.filter((a: any) => {
      const d = toDateOnly(a.dateObj);

      if (filter === "today") return isSameDay(d, today);
      if (filter === "week") return d >= weekStart && d <= weekEnd;
      return true; // all
    });

    // orden: fecha desc, hora desc
    filtered.sort((x: any, y: any) => {
      const keyX = `${x.date} ${x.time}`;
      const keyY = `${y.date} ${y.time}`;
      return keyY.localeCompare(keyX);
    });

    return filtered;
  }, [appointments, filter]);

  const FilterButton = ({
    active,
    label,
    onClick,
  }: {
    active: boolean;
    label: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg border font-semibold transition ${
        active
          ? "bg-blue-700 text-white border-blue-700 shadow"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header bonito */}
      <div className="rounded-xl bg-blue-700 px-6 py-5 shadow">
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">
          Gestión de Citas
        </h1>
        <p className="text-blue-100 mt-1">
          Citas registradas por el asistente
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <FilterButton
          active={filter === "today"}
          label="Hoy"
          onClick={() => setFilter("today")}
        />
        <FilterButton
          active={filter === "week"}
          label="Esta semana"
          onClick={() => setFilter("week")}
        />
        <FilterButton
          active={filter === "all"}
          label="Todas"
          onClick={() => setFilter("all")}
        />

        <div className="ml-auto text-slate-600 text-sm">
          Mostrando: <b>{rows.length}</b> citas
        </div>
      </div>

      {/* Estados */}
      {loading && (
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-gray-600">Cargando citas...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4">
          <p className="text-rose-700 font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-gray-600">
            No hay citas para el filtro seleccionado.
          </p>
        </div>
      )}

      {/* Tabla estilo Excel */}
      {!loading && !error && rows.length > 0 && (
        <div className="rounded-xl bg-white shadow overflow-hidden border">
          <div className="overflow-auto">
            <table className="w-full border-collapse">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border px-4 py-3 text-center font-bold text-slate-700">
                    Paciente
                  </th>
                  <th className="border px-4 py-3 text-center font-bold text-slate-700">
                    Teléfono
                  </th>
                  <th className="border px-4 py-3 text-center font-bold text-slate-700">
                    Fecha
                  </th>
                  <th className="border px-4 py-3 text-center font-bold text-slate-700">
                    Hora
                  </th>
                  <th className="border px-4 py-3 text-center font-bold text-slate-700">
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((appt: any, idx: number) => (
                  <tr
                    key={appt.id}
                    className={`${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                    } hover:bg-blue-50 transition`}
                  >
                    <td className="border px-4 py-3">{appt.patient_name}</td>
                    <td className="border px-4 py-3 font-mono">{appt.phone}</td>
                    <td className="border px-4 py-3 text-center">{appt.date}</td>
                    <td className="border px-4 py-3 text-center">{appt.time}</td>
                    <td className="border px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold border ${statusStyles(
                          appt.statusEs
                        )}`}
                      >
                        {appt.statusEs}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 text-sm text-slate-600 bg-slate-50 border-t">
            Total (filtro): <b>{rows.length}</b> citas
          </div>
        </div>
      )}
    </div>
  );
}
