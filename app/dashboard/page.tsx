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

const API = process.env.NEXT_PUBLIC_API_BASE;

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysISO(baseISO: string, days: number) {
  const d = new Date(`${baseISO}T00:00:00`);
  d.setDate(d.getDate() + days);
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

function endOfWeekISO() {
  return addDaysISO(startOfWeekISO(), 6);
}

function monthStartISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

function monthEndISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return `${yyyy}-${mm}-${String(lastDay).padStart(2, "0")}`;
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

function formatDateShort(date?: string) {
  if (!date) return "-";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDayShort(date?: string) {
  if (!date) return "-";
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("es-EC", {
    weekday: "short",
    day: "2-digit",
  });
}

function safePercent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function compareDateTimeAsc(a: Appointment, b: Appointment) {
  const da = `${a.date ?? ""} ${a.time ?? ""}`.trim();
  const db = `${b.date ?? ""} ${b.time ?? ""}`.trim();
  return da.localeCompare(db);
}

function compareDateTimeDesc(a: Appointment, b: Appointment) {
  const da = `${a.date ?? ""} ${a.time ?? ""}`.trim();
  const db = `${b.date ?? ""} ${b.time ?? ""}`.trim();
  return db.localeCompare(da);
}

function toDateTime(date?: string, time?: string) {
  if (!date) return null;
  const safeTime = time && /^\d{2}:\d{2}/.test(time) ? time : "00:00";
  const parsed = new Date(`${date}T${safeTime}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isBetween(date: string | undefined, startISO: string, endISO: string) {
  if (!date) return false;
  return date >= startISO && date <= endISO;
}

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clinicSlug, setClinicSlug] = useState<string>("");

  const TODAY = todayISO();
  const WEEK_START = startOfWeekISO();
  const WEEK_END = endOfWeekISO();
  const MONTH_START = monthStartISO();
  const MONTH_END = monthEndISO();
  const NEXT_7_DAYS_END = addDaysISO(TODAY, 6);

  const clinicTheme = useMemo(() => getClinicTheme(clinicSlug), [clinicSlug]);

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
          localStorage.removeItem("siadvoice_clinic_slug");
          window.location.href = "/login";
          return;
        }

        if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);

        const data = await res.json();
        setAppointments(Array.isArray(data) ? data : data.items ?? []);
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
    const week = appointments.filter((a) => isBetween(a.date, WEEK_START, WEEK_END)).length;
    const month = appointments.filter((a) => isBetween(a.date, MONTH_START, MONTH_END)).length;
    const next7Days = appointments.filter((a) => isBetween(a.date, TODAY, NEXT_7_DAYS_END)).length;

    const scheduled = appointments.filter((a) => a.status === "scheduled").length;
    const completed = appointments.filter((a) => a.status === "completed").length;
    const canceled = appointments.filter((a) => a.status === "canceled").length;

    const completionRate = safePercent(completed, total);
    const cancellationRate = safePercent(canceled, total);
    const occupancyRate = safePercent(next7Days, total);

    return {
      total,
      today,
      week,
      month,
      next7Days,
      scheduled,
      completed,
      canceled,
      completionRate,
      cancellationRate,
      occupancyRate,
    };
  }, [appointments, TODAY, WEEK_START, WEEK_END, MONTH_START, MONTH_END, NEXT_7_DAYS_END]);

  const last = useMemo(() => {
    const sorted = [...appointments].sort(compareDateTimeDesc);
    return sorted.slice(0, 5);
  }, [appointments]);

  const nextAppointment = useMemo(() => {
    const now = new Date();

    const upcoming = appointments
      .filter((a) => a.status !== "canceled")
      .filter((a) => {
        const dt = toDateTime(a.date, a.time);
        return dt ? dt >= now : false;
      })
      .sort(compareDateTimeAsc);

    return upcoming[0] ?? null;
  }, [appointments]);

  const statusBreakdown = useMemo(() => {
    const total = appointments.length;
    const scheduledCount = appointments.filter((a) => a.status === "scheduled").length;
    const completedCount = appointments.filter((a) => a.status === "completed").length;
    const canceledCount = appointments.filter((a) => a.status === "canceled").length;

    return {
      scheduledCount,
      completedCount,
      canceledCount,
      scheduledPct: safePercent(scheduledCount, total),
      completedPct: safePercent(completedCount, total),
      canceledPct: safePercent(canceledCount, total),
    };
  }, [appointments]);

  const dailyFlow = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, idx) => {
      const date = addDaysISO(TODAY, -6 + idx);
      const count = appointments.filter((a) => a.date === date).length;
      return { date, count };
    });

    const max = Math.max(...days.map((d) => d.count), 1);

    return days.map((d) => ({
      ...d,
      height: Math.max(12, Math.round((d.count / max) * 140)),
    }));
  }, [appointments, TODAY]);

  const miniInsights = useMemo(() => {
    const activeLoad = metrics.scheduled + metrics.completed;
    const canceledImpact = safePercent(metrics.canceled, activeLoad + metrics.canceled);

    return {
      activeLoad,
      canceledImpact,
      message:
        metrics.today > 0
          ? `Hoy tienes ${metrics.today} cita${metrics.today === 1 ? "" : "s"} registrada${metrics.today === 1 ? "" : "s"}.`
          : "Hoy no hay citas registradas en agenda.",
    };
  }, [metrics]);

  const donutStyle = useMemo(() => {
    const scheduled = statusBreakdown.scheduledPct;
    const completed = statusBreakdown.completedPct;
    const canceled = statusBreakdown.canceledPct;
    return {
      background: `conic-gradient(
        rgb(52 211 153) 0% ${scheduled}%,
        rgb(56 189 248) ${scheduled}% ${scheduled + completed}%,
        rgb(251 113 133) ${scheduled + completed}% ${scheduled + completed + canceled}%,
        rgb(226 232 240) ${scheduled + completed + canceled}% 100%
      )`,
    };
  }, [statusBreakdown]);

  const handleLogout = () => {
    localStorage.removeItem("siadvoice_token");
    localStorage.removeItem("siadvoice_clinic_slug");
    window.location.href = "/login";
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative p-6 md:p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-white to-slate-50" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border ${clinicTheme.accent.border} ${clinicTheme.accent.soft} text-xl font-bold ${clinicTheme.accent.text} shadow-sm`}
              >
                {clinicTheme.initials}
              </div>

              <div>
                <div
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${clinicTheme.accent.border} ${clinicTheme.accent.soft} ${clinicTheme.accent.text}`}
                >
                  Dashboard ejecutivo KPI v2
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                  {clinicTheme.displayName}
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                  {clinicTheme.subtitle} Seguimiento visual de citas, carga operativa y desempeño general.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {clinicSlug && (
                    <p
                      className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${clinicTheme.accent.border} ${clinicTheme.accent.soft} ${clinicTheme.accent.text}`}
                    >
                      Clínica activa: {clinicSlug}
                    </p>
                  )}

                  <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
                    Especialidad: {clinicTheme.specialty}
                  </p>

                  <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
                    Semana: {formatDateShort(WEEK_START)} - {formatDateShort(WEEK_END)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
                <p className="font-medium text-slate-900">Resumen rápido</p>
                <p className="mt-1">{miniInsights.message}</p>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
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
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <div className={`rounded-3xl border bg-white p-6 shadow-sm ${clinicTheme.accent.border}`}>
              <p className="text-sm font-medium text-slate-500">Citas hoy</p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">{metrics.today}</p>
              <p className="mt-2 text-sm text-slate-500">Agenda correspondiente al día actual.</p>
            </div>

            <div className={`rounded-3xl border bg-white p-6 shadow-sm ${clinicTheme.accent.border}`}>
              <p className="text-sm font-medium text-slate-500">Próximos 7 días</p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">{metrics.next7Days}</p>
              <p className="mt-2 text-sm text-slate-500">Carga operativa desde hoy hasta los próximos 6 días.</p>
            </div>

            <div className={`rounded-3xl border bg-white p-6 shadow-sm ${clinicTheme.accent.border}`}>
              <p className="text-sm font-medium text-slate-500">Total de citas</p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">{metrics.total}</p>
              <p className="mt-2 text-sm text-slate-500">Histórico disponible para la clínica activa.</p>
            </div>

            <div className={`rounded-3xl border bg-white p-6 shadow-sm ${clinicTheme.accent.border}`}>
              <p className="text-sm font-medium text-slate-500">Esta semana</p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">{metrics.week}</p>
              <p className="mt-2 text-sm text-slate-500">Citas entre lunes y domingo de la semana actual.</p>
            </div>

            <div className={`rounded-3xl border bg-white p-6 shadow-sm ${clinicTheme.accent.border}`}>
              <p className="text-sm font-medium text-slate-500">Completadas</p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">{metrics.completed}</p>
              <p className="mt-2 text-sm text-slate-500">Tasa de cierre: {metrics.completionRate}%</p>
            </div>

            <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Cancelación</p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">{metrics.cancellationRate}%</p>
              <p className="mt-2 text-sm text-slate-500">{metrics.canceled} canceladas en total.</p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Actividad de los últimos 7 días</h2>
                  <p className="mt-1 text-sm text-slate-500">Vista rápida del comportamiento diario de citas registradas.</p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
                  Total ventana: {dailyFlow.reduce((acc, item) => acc + item.count, 0)}
                </div>
              </div>

              <div className="mt-8 grid h-52 grid-cols-7 items-end gap-3">
                {dailyFlow.map((item) => (
                  <div key={item.date} className="flex h-full flex-col items-center justify-end gap-2">
                    <div className="text-xs font-semibold text-slate-700">{item.count}</div>
                    <div className="flex h-40 w-full items-end justify-center rounded-2xl bg-slate-50 px-2 py-2">
                      <div
                        className={`w-full rounded-xl ${clinicTheme.accent.soft} ${clinicTheme.accent.border} border`}
                        style={{ height: `${item.height}px` }}
                      />
                    </div>
                    <div className="text-center text-xs text-slate-500">{formatDayShort(item.date)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Distribución por estado</h2>
              <p className="mt-1 text-sm text-slate-500">Balance entre programadas, completadas y canceladas.</p>

              <div className="mt-6 flex items-center justify-center">
                <div className="relative flex h-44 w-44 items-center justify-center rounded-full" style={donutStyle}>
                  <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                    <span className="text-2xl font-bold text-slate-900">{metrics.total}</span>
                    <span className="text-xs text-slate-500">citas</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="text-sm font-medium text-slate-700">Programadas</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {statusBreakdown.scheduledCount} · {statusBreakdown.scheduledPct}%
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-sky-400" />
                    <span className="text-sm font-medium text-slate-700">Completadas</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {statusBreakdown.completedCount} · {statusBreakdown.completedPct}%
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-rose-400" />
                    <span className="text-sm font-medium text-slate-700">Canceladas</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {statusBreakdown.canceledCount} · {statusBreakdown.canceledPct}%
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Resumen operativo</h2>
                  <p className="mt-1 text-sm text-slate-500">Indicadores clave del periodo actual para {clinicTheme.displayName}.</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Este mes</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.month}</p>
                  <p className="mt-2 text-sm text-slate-600">Volumen acumulado del mes actual.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Efectividad</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.completionRate}%</p>
                  <p className="mt-2 text-sm text-slate-600">Porcentaje de citas completadas.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Carga futura</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.occupancyRate}%</p>
                  <p className="mt-2 text-sm text-slate-600">Peso de los próximos 7 días sobre el histórico.</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">Programadas</span>
                    <span className="text-slate-500">{statusBreakdown.scheduledPct}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div className="h-3 rounded-full bg-emerald-400" style={{ width: `${statusBreakdown.scheduledPct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">Completadas</span>
                    <span className="text-slate-500">{statusBreakdown.completedPct}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div className="h-3 rounded-full bg-sky-400" style={{ width: `${statusBreakdown.completedPct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">Canceladas</span>
                    <span className="text-slate-500">{statusBreakdown.canceledPct}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div className="h-3 rounded-full bg-rose-400" style={{ width: `${statusBreakdown.canceledPct}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Próxima cita</h2>
              <p className="mt-1 text-sm text-slate-500">Siguiente atención futura registrada en el sistema.</p>

              {!nextAppointment ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
                  No hay próximas citas disponibles.
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Paciente</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{nextAppointment.patient_name ?? "-"}</p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Fecha</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatDateShort(nextAppointment.date)}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Hora</p>
                      <p className="mt-1 font-semibold text-slate-900">{nextAppointment.time ?? "-"}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Teléfono</p>
                    <p className="mt-1 text-slate-700">{nextAppointment.patient_phone ?? "-"}</p>
                  </div>

                  <div className="mt-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(nextAppointment.status)}`}>
                      {translateStatus(nextAppointment.status)}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 gap-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Carga activa</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{miniInsights.activeLoad}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Impacto cancelación</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{miniInsights.canceledImpact}%</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Últimas citas</h2>
                <p className="mt-1 text-sm text-slate-500">Vista rápida de los registros más recientes de {clinicTheme.displayName}.</p>
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
                      <tr key={String(a.id ?? idx)} className="transition hover:bg-slate-50">
                        <td className="px-4 py-4 font-medium text-slate-900">{a.patient_name ?? "-"}</td>
                        <td className="px-4 py-4 text-slate-600">{a.patient_phone ?? "-"}</td>
                        <td className="px-4 py-4 text-slate-600">{formatDateShort(a.date)}</td>
                        <td className="px-4 py-4 text-slate-600">{a.time ?? "-"}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(a.status)}`}>
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
