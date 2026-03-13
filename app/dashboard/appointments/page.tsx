"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

      const clinicSlug =
        typeof window !== "undefined"
          ? localStorage.getItem("siadvoice_clinic_slug")
          : null;

      if (!token || !clinicSlug) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${API}/appointments`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Clinic-Slug": clinicSlug,
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

      const clinicSlug =
        typeof window !== "undefined"
          ? localStorage.getItem("siadvoice_clinic_slug")
          : null;

      if (!token || !clinicSlug) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${API}/appointments/${id}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Clinic-Slug": clinicSlug,
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
      <section className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Citas</h1>
        <p className="mt-2 text-sm text-blue-100">
          Citas registradas por el asistente virtual de la clínica.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("today")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              filter === "today"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Hoy
          </button>

          <button
            onClick={() => setFilter("week")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              filter === "week"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Esta semana
          </button>

          <button
            onClick={() => setFilter("all")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              filter === "all"
                ? "bg-blue-600 text-white shadow-sm"
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
              Visualiza, filtra y gestiona las citas registradas.
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