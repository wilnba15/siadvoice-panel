"use client";

import { useEffect, useMemo, useState } from "react";
import { getClinicTheme } from "@/lib/clinic-theme";

type AppointmentStatus = "scheduled" | "completed" | "canceled" | "";
type FilterMode = "today" | "week" | "all";
type StatusFilter = "all" | "scheduled" | "completed" | "canceled";

type Appointment = {
  id?: string | number;
  patient_name?: string;
  patient_phone?: string;
  date?: string;
  time?: string;
  status?: AppointmentStatus | string;
};

type EditForm = {
  patient_name: string;
  patient_phone: string;
  date: string;
  time: string;
};

const API = process.env.NEXT_PUBLIC_API_BASE;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function todayISO(base = new Date()) {
  return `${base.getFullYear()}-${pad2(base.getMonth() + 1)}-${pad2(base.getDate())}`;
}

function startOfWeekISO(base = new Date()) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return todayISO(d);
}

function endOfWeekISO(base = new Date()) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 12, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + 6);
  return todayISO(d);
}

function parseLocalDate(dateISO?: string) {
  if (!dateISO) return null;
  const [y, m, d] = dateISO.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0, 0);
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

function buttonBase(disabled?: boolean) {
  return `inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition ${
    disabled ? "cursor-not-allowed opacity-50" : "hover:opacity-90"
  }`;
}

function toDateTimeLocal(date?: string, time?: string) {
  if (!date || !time) return "";
  return `${date}T${time}`;
}

function splitDateTimeLocal(value?: string) {
  if (!value || !value.includes("T")) {
    return { date: "", time: "" };
  }
  const [date, time] = value.split("T");
  return { date: date || "", time: (time || "").slice(0, 5) };
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
      row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [workingId, setWorkingId] = useState<string | number | null>(null);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    patient_name: "",
    patient_phone: "",
    date: "",
    time: "",
  });

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

  const counters = useMemo(() => {
    const all = appointments.length;
    const today = appointments.filter((a) => (a.date ?? "") === TODAY).length;
    const week = appointments.filter((a) => {
      const date = a.date ?? "";
      return date >= WEEK_START && date <= WEEK_END;
    }).length;
    const scheduled = appointments.filter((a) => a.status === "scheduled").length;
    const completed = appointments.filter((a) => a.status === "completed").length;
    const canceled = appointments.filter((a) => a.status === "canceled").length;

    return { all, today, week, scheduled, completed, canceled };
  }, [appointments, TODAY, WEEK_START, WEEK_END]);

  const filteredAppointments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...appointments]
      .sort(compareDateTimeDesc)
      .filter((a) => {
        if (filter === "today") {
          return (a.date ?? "") === TODAY;
        }
        if (filter === "week") {
          const date = a.date ?? "";
          return date >= WEEK_START && date <= WEEK_END;
        }
        return true;
      })
      .filter((a) => {
        if (statusFilter === "all") return true;
        return (a.status ?? "") === statusFilter;
      })
      .filter((a) => {
        if (!normalizedSearch) return true;
        const text = `${a.patient_name ?? ""} ${a.patient_phone ?? ""}`.toLowerCase();
        return text.includes(normalizedSearch);
      });
  }, [appointments, filter, statusFilter, search, TODAY, WEEK_START, WEEK_END]);

  async function apiAction(path: string, method: string, body?: Record<string, any>) {
    const token = localStorage.getItem("siadvoice_token");
    const savedClinicSlug = localStorage.getItem("siadvoice_clinic_slug") || "";

    if (!token || !savedClinicSlug) {
      window.location.href = "/login";
      return null;
    }

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      "X-Clinic-Slug": savedClinicSlug,
    };

    if (body) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      localStorage.removeItem("siadvoice_token");
      localStorage.removeItem("siadvoice_clinic_slug");
      window.location.href = "/login";
      return null;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `API ${res.status} ${res.statusText}`);
    }

    return res.json();
  }

  async function handleCancel(appt: Appointment) {
    if (!appt.id || appt.status === "canceled") return;

    const ok = window.confirm(`¿Deseas cancelar la cita de ${appt.patient_name ?? "este paciente"}?`);
    if (!ok) return;

    try {
      setWorkingId(appt.id);
      setError(null);
      const updated = await apiAction(`/appointments/${appt.id}/cancel`, "PATCH");
      if (!updated) return;
      setAppointments((prev) =>
        prev.map((item) => (String(item.id) === String(appt.id) ? { ...item, ...updated } : item))
      );
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cancelar la cita");
    } finally {
      setWorkingId(null);
    }
  }

  async function handleComplete(appt: Appointment) {
    if (!appt.id || appt.status === "completed") return;

    const ok = window.confirm(`¿Marcar como completada la cita de ${appt.patient_name ?? "este paciente"}?`);
    if (!ok) return;

    try {
      setWorkingId(appt.id);
      setError(null);
      const updated = await apiAction(`/appointments/${appt.id}/complete`, "PATCH");
      if (!updated) return;
      setAppointments((prev) =>
        prev.map((item) => (String(item.id) === String(appt.id) ? { ...item, ...updated } : item))
      );
    } catch (e: any) {
      setError(e?.message ?? "No se pudo completar la cita");
    } finally {
      setWorkingId(null);
    }
  }

  function openEdit(appt: Appointment) {
    setEditing(appt);
    setEditForm({
      patient_name: appt.patient_name ?? "",
      patient_phone: appt.patient_phone ?? "",
      date: appt.date ?? "",
      time: appt.time ?? "",
    });
  }

  async function handleSaveEdit() {
    if (!editing?.id) return;
    if (!editForm.patient_name.trim() || !editForm.patient_phone.trim() || !editForm.date || !editForm.time) {
      setError("Completa nombre, teléfono, fecha y hora.");
      return;
    }

    try {
      setWorkingId(editing.id);
      setError(null);
      const updated = await apiAction(`/appointments/${editing.id}`, "PATCH", {
        patient_name: editForm.patient_name.trim(),
        patient_phone: editForm.patient_phone.trim(),
        start_time: `${editForm.date}T${editForm.time}:00`,
      });

      if (!updated) return;

      setAppointments((prev) =>
        prev
          .map((item) => (String(item.id) === String(editing.id) ? { ...item, ...updated } : item))
          .sort(compareDateTimeDesc)
      );
      setEditing(null);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo editar la cita");
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
              Citas PRO de {clinicTheme.displayName}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Visualiza, filtra, busca, exporta y gestiona las citas registradas de {clinicTheme.displayName}.
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

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Hoy", value: counters.today },
          { label: "Esta semana", value: counters.week },
          { label: "Total", value: counters.all },
          { label: "Programadas", value: counters.scheduled },
          { label: "Completadas", value: counters.completed },
          { label: "Canceladas", value: counters.canceled },
        ].map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setFilter("today")}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                filter === "today" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setFilter("week")}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                filter === "week" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Esta semana
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                filter === "all" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Todas
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-0"
            >
              <option value="all">Todos los estados</option>
              <option value="scheduled">Programadas</option>
              <option value="completed">Completadas</option>
              <option value="canceled">Canceladas</option>
            </select>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por paciente o teléfono"
              className="min-w-[260px] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
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
            <h2 className="text-2xl font-semibold text-slate-900">Listado PRO de citas</h2>
            <p className="mt-2 text-sm text-slate-600">
              Vista operativa con filtro por fecha, filtro por estado, búsqueda, edición, completado y cancelación.
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
                <tbody>
                  {filteredAppointments.map((appt) => {
                    const disabled = workingId !== null && String(workingId) === String(appt.id);
                    const isCanceled = appt.status === "canceled";
                    const isCompleted = appt.status === "completed";

                    return (
                      <tr key={String(appt.id)} className="border-t border-slate-200 text-slate-800">
                        <td className="px-5 py-4 font-semibold">{appt.patient_name || "-"}</td>
                        <td className="px-5 py-4">{appt.patient_phone || "-"}</td>
                        <td className="px-5 py-4">{formatDateLong(appt.date)}</td>
                        <td className="px-5 py-4">{appt.time || "-"}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusClasses(appt.status)}`}>
                            {translateStatus(appt.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openEdit(appt)}
                              disabled={disabled}
                              className={`${buttonBase(disabled)} border border-slate-300 bg-white text-slate-700`}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleComplete(appt)}
                              disabled={disabled || isCompleted || isCanceled}
                              className={`${buttonBase(disabled || isCompleted || isCanceled)} bg-sky-600 text-white`}
                            >
                              Completar
                            </button>
                            <button
                              onClick={() => handleCancel(appt)}
                              disabled={disabled || isCanceled || isCompleted}
                              className={`${buttonBase(disabled || isCanceled || isCompleted)} bg-rose-500 text-white`}
                            >
                              Cancelar
                            </button>
                          </div>
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

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Editar cita</h3>
                <p className="mt-1 text-sm text-slate-600">Actualiza nombre, teléfono, fecha y hora.</p>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Paciente</label>
                <input
                  value={editForm.patient_name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, patient_name: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Teléfono</label>
                <input
                  value={editForm.patient_phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, patient_phone: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Fecha</label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Hora</label>
                <input
                  type="time"
                  value={editForm.time}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, time: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                onClick={() => setEditing(null)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={workingId !== null}
                className={`${buttonBase(workingId !== null)} rounded-2xl bg-blue-600 px-4 py-2 text-white`}
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
