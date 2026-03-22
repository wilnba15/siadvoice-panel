"use client";

import { useEffect, useMemo, useState } from "react";
import { getClinicTheme } from "@/lib/clinic-theme";

type Appointment = {
  id?: string | number;
  patient_name?: string;
  patient_phone?: string;
  date?: string;
  time?: string;
  status?: string;
};

type FilterMode = "today" | "week" | "all";

const API = process.env.NEXT_PUBLIC_API_BASE;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseLocalDate(dateISO?: string) {
  if (!dateISO) return null;
  const [y, m, d] = dateISO.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function startOfWeekISO(base = new Date()) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function endOfWeekISO(base = new Date()) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + 6);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function compareDateTimeDesc(a: Appointment, b: Appointment) {
  const da = `${a.date ?? ""} ${a.time ?? ""}`.trim();
  const db = `${b.date ?? ""} ${b.time ?? ""}`.trim();
  return db.localeCompare(da);
}

function formatDateLong(dateISO?: string) {
  if (!dateISO) return "-";
  const parsed = parseLocalDate(dateISO);
  if (!parsed) return dateISO;
  return parsed.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function translateStatus(status?: string) {
  if (status === "scheduled") return "Programada";
  if (status === "completed") return "Completada";
  if (status === "canceled") return "Cancelada";
  return status || "Sin estado";
}

function statusClasses(status?: string) {
  if (status === "scheduled") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "completed") {
    return "border border-sky-200 bg-sky-50 text-sky-700";
  }
  if (status === "canceled") {
    return "border border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border border-slate-200 bg-slate-50 text-slate-700";
}

function downloadCSV(rows: Appointment[], clinicName: string) {
  const headers = ["Paciente", "Telefono", "Fecha", "Hora", "Estado"];
  const body = rows.map((a) => [
    a.patient_name ?? "",
    a.patient_phone ?? "",
    a.date ?? "",
    a.time ?? "",
    translateStatus(a.status),
  ]);

  const csv = [headers, ...body]
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = clinicName.toLowerCase().replace(/\s+/g, "-");
  link.href = url;
  link.download = `citas-${safeName}-${todayISO()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clinicSlug, setClinicSlug] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [workingId, setWorkingId] = useState<string | number | null>(null);

  const clinicTheme = useMemo(() => getClinicTheme(clinicSlug), [clinicSlug]);

  const TODAY = todayISO();
  const WEEK_START = startOfWeekISO();
  const WEEK_END = endOfWeekISO();

  async function loadAppointments() {
    const token = localStorage.getItem("siadvoice_token");
    const savedClinicSlug = localStorage.getItem("siadvoice_clinic_slug") || "";

    setClinicSlug(savedClinicSlug);

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (!API) {
      setError("Falta NEXT_PUBLIC_API_BASE");
      setLoading(false);
      return;
    }

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
        localStorage.removeItem("siadvoice_clinic_slug");
        window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        throw new Error(`API ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const items = Array.isArray(data) ? data : data.items ?? [];
      setAppointments([...items].sort(compareDateTimeDesc));
    } catch (e: any) {
      setError(e?.message ?? "Error cargando citas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    const sorted = [...appointments].sort(compareDateTimeDesc);

    if (filter === "all") return sorted;

    if (filter === "today") {
      return sorted.filter((a) => (a.date ?? "") === TODAY);
    }

    return sorted.filter((a) => {
      const date = a.date ?? "";
      return date >= WEEK_START && date <= WEEK_END;
    });
  }, [appointments, filter, TODAY, WEEK_START, WEEK_END]);

  const counters = useMemo(() => {
    const all = appointments.length;
    const today = appointments.filter((a) => (a.date ?? "") === TODAY).length;
    const week = appointments.filter((a) => {
      const date = a.date ?? "";
      return date >= WEEK_START && date <= WEEK_END;
    }).length;
    return { all, today, week };
  }, [appointments, TODAY, WEEK_START, WEEK_END]);

  async function handleCancel(appt: Appointment) {
    if (!appt.id) return;
    if (appt.status === "canceled") return;

    const ok = window.confirm(
      `¿Deseas cancelar la cita de ${appt.patient_name ?? "este paciente"}?`
    );
    if (!ok) return;

    const token = localStorage.getItem("siadvoice_token");
    const savedClinicSlug = localStorage.getItem("siadvoice_clinic_slug") || "";

    if (!token || !savedClinicSlug) {
      window.location.href = "/login";
      return;
    }

    try {
      setWorkingId(appt.id);
      setError(null);

      const res = await fetch(`${API}/appointments/${appt.id}/cancel`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Clinic-Slug": savedClinicSlug,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("siadvoice_token");
        localStorage.removeItem("siadvoice_clinic_slug");
        window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `API ${res.status} ${res.statusText}`);
      }

      setAppointments((prev) =>
        prev.map((item) =>
          String(item.id) === String(appt.id)
            ? { ...item, status: "canceled" }
            : item
        )
      );
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cancelar la cita");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Citas de {clinicTheme.displayName}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Visualiza, filtra y gestiona las citas registradas de{" "}
              {clinicTheme.displayName}.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${clinicTheme.accent.border} ${clinicTheme.accent.soft} ${clinicTheme.accent.text}`}
              >
                Clínica activa: {clinicSlug || "-"}
              </span>

              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
                Semana: {formatDateLong(WEEK_START)} - {formatDateLong(WEEK_END)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => downloadCSV(filteredAppointments, clinicTheme.displayName)}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Exportar CSV
            </button>

            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Volver al dashboard
            </a>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setFilter("today")}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              filter === "today"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Hoy
            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {counters.today}
            </span>
          </button>

          <button
            onClick={() => setFilter("week")}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              filter === "week"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Esta semana
            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {counters.week}
            </span>
          </button>

          <button
            onClick={() => setFilter("all")}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              filter === "all"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Todas
            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {counters.all}
            </span>
          </button>
        </div>
      </section>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-slate-600">Cargando citas...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-2xl font-semibold text-slate-900">
              Listado de citas
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Vista operativa con filtro por fecha, exportación y cancelación.
            </p>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="p-6">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-lg text-slate-600">
                No hay citas para mostrar.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-slate-600">
                    <th className="px-5 py-4 font-semibold">Paciente</th>
                    <th className="px-5 py-4 font-semibold">Teléfono</th>
                    <th className="px-5 py-4 font-semibold">Fecha</th>
                    <th className="px-5 py-4 font-semibold">Hora</th>
                    <th className="px-5 py-4 font-semibold">Estado</th>
                    <th className="px-5 py-4 font-semibold">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredAppointments.map((appt, idx) => {
                    const isCanceled = appt.status === "canceled";
                    const isWorking = String(workingId) === String(appt.id);

                    return (
                      <tr
                        key={String(appt.id ?? idx)}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-5 font-semibold text-slate-900">
                          {appt.patient_name ?? "-"}
                        </td>
                        <td className="px-5 py-5 text-slate-600">
                          {appt.patient_phone ?? "-"}
                        </td>
                        <td className="px-5 py-5 text-slate-600">
                          {formatDateLong(appt.date)}
                        </td>
                        <td className="px-5 py-5 text-slate-600">
                          {appt.time ?? "-"}
                        </td>
                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                              appt.status
                            )}`}
                          >
                            {translateStatus(appt.status)}
                          </span>
                        </td>
                        <td className="px-5 py-5">
                          <button
                            onClick={() => handleCancel(appt)}
                            disabled={isCanceled || isWorking}
                            className={`inline-flex min-w-[110px] items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
                              isCanceled || isWorking
                                ? "cursor-not-allowed bg-slate-300"
                                : "bg-rose-500 hover:bg-rose-600"
                            }`}
                          >
                            {isCanceled
                              ? "Cancelada"
                              : isWorking
                              ? "Procesando..."
                              : "Cancelar"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
