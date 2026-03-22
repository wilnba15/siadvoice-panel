"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getClinicTheme } from "@/lib/clinic-theme";

type Appointment = {
  id: number;
  patient_name?: string;
  patient_phone?: string;
  date?: string;
  time?: string;
  status?: string;
};

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function AppointmentsPage() {
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clinicSlug, setClinicSlug] = useState("");

  const clinicTheme = useMemo(() => getClinicTheme(clinicSlug), [clinicSlug]);

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    try {
      setLoading(true);
      setError("");

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("siadvoice_token")
          : null;

      const savedClinicSlug =
        typeof window !== "undefined"
          ? localStorage.getItem("siadvoice_clinic_slug")
          : null;

      setClinicSlug(savedClinicSlug || "");

      if (!token || !savedClinicSlug) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${API}/appointments`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Clinic-Slug": savedClinicSlug,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("siadvoice_token");
        localStorage.removeItem("siadvoice_clinic_slug");
        localStorage.removeItem("token");
        localStorage.removeItem("clinic_slug");
        router.push("/login");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        console.error("Error backend /appointments:", data);
        setError(data?.detail || "No se pudieron cargar las citas");
        setAppointments([]);
        return;
      }

      if (Array.isArray(data)) {
        setAppointments(data);
      } else {
        console.error("La respuesta no es array:", data);
        setAppointments([]);
        setError("La respuesta del servidor no tiene el formato esperado");
      }
    } catch (err) {
      console.error("Error cargando citas", err);
      setAppointments([]);
      setError("Error de conexión cargando citas");
    } finally {
      setLoading(false);
    }
  }

  async function cancelAppointment(id: number) {
    const confirmCancel = window.confirm(
      "¿Seguro que deseas cancelar esta cita?"
    );
    if (!confirmCancel) return;

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("siadvoice_token")
          : null;

      const savedClinicSlug =
        typeof window !== "undefined"
          ? localStorage.getItem("siadvoice_clinic_slug")
          : null;

      if (!token || !savedClinicSlug) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${API}/appointments/${id}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Clinic-Slug": savedClinicSlug,
        },
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        localStorage.removeItem("siadvoice_token");
        localStorage.removeItem("siadvoice_clinic_slug");
        localStorage.removeItem("token");
        localStorage.removeItem("clinic_slug");
        router.push("/login");
        return;
      }

      if (!res.ok) {
        console.error("Error cancelando cita:", data);
        alert(data?.detail || "Error cancelando cita");
        return;
      }

      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === id ? { ...appt, status: "canceled" } : appt
        )
      );
    } catch (err) {
      console.error("Error cancelando cita", err);
      alert("Error cancelando cita");
    }
  }

  function translateStatus(status?: string) {
    if (status === "scheduled") return "Programada";
    if (status === "canceled") return "Cancelada";
    if (status === "completed") return "Completada";
    return status || "Sin estado";
  }

  function statusColor(status?: string) {
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

  const filteredAppointments = useMemo(() => {
    if (!Array.isArray(appointments)) return [];

    return appointments.filter((appt) => {
      if (filter === "all") return true;

      const today = new Date().toISOString().slice(0, 10);

      if (filter === "today") {
        return appt.date === today;
      }

      if (filter === "week") {
        if (!appt.date) return false;

        const apptDate = new Date(`${appt.date}T00:00:00`);
        const now = new Date();
        const todayOnly = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        const diff =
          (apptDate.getTime() - todayOnly.getTime()) / (1000 * 3600 * 24);

        return diff >= 0 && diff <= 7;
      }

      return true;
    });
  }, [appointments, filter]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border ${clinicTheme.accent.border} ${clinicTheme.accent.soft} text-xl font-bold ${clinicTheme.accent.text} shadow-sm`}
            >
              {clinicTheme.initials}
            </div>

            <div>
              <div
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${clinicTheme.accent.soft} ${clinicTheme.accent.text} border ${clinicTheme.accent.border}`}
              >
                Gestión de citas
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                {clinicTheme.displayName}
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                Agenda, filtra y administra las citas registradas por el
                asistente virtual.
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
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("today")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              filter === "today"
                ? `${clinicTheme.accent.button} shadow-sm`
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Hoy
          </button>

          <button
            onClick={() => setFilter("week")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              filter === "week"
                ? `${clinicTheme.accent.button} shadow-sm`
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Esta semana
          </button>

          <button
            onClick={() => setFilter("all")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              filter === "all"
                ? `${clinicTheme.accent.button} shadow-sm`
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Todas
          </button>
        </div>
      </section>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-slate-600">Cargando citas...</p>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700 shadow-sm">
          {error}
        </div>
      )}

      {!loading && !error && filteredAppointments.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-600 shadow-sm">
          No hay citas para mostrar.
        </div>
      )}

      {!loading && !error && filteredAppointments.length > 0 && (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Listado de citas
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Visualiza, filtra y gestiona las citas registradas de{" "}
              {clinicTheme.displayName}.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold">Paciente</th>
                  <th className="px-4 py-3 font-semibold">Teléfono</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Hora</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredAppointments.map((appt) => (
                  <tr key={appt.id} className="transition hover:bg-slate-50">
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {appt.patient_name || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {appt.patient_phone || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {appt.date || "-"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {appt.time || "-"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColor(
                          appt.status
                        )}`}
                      >
                        {translateStatus(appt.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {appt.status !== "canceled" && (
                        <button
                          onClick={() => cancelAppointment(appt.id)}
                          className="rounded-xl bg-rose-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}