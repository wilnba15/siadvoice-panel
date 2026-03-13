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
    if (status === "scheduled") return "bg-green-100 text-green-700";
    if (status === "canceled") return "bg-red-100 text-red-700";
    if (status === "completed") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-700";
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
    <div className="p-8">
      <div className="bg-blue-600 text-white p-6 rounded-xl mb-6">
        <h1 className="text-2xl font-bold">Gestión de Citas</h1>
        <p className="opacity-90">Citas registradas por el asistente</p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter("today")}
          className={`px-4 py-2 rounded ${
            filter === "today" ? "bg-blue-600 text-white" : "bg-gray-100"
          }`}
        >
          Hoy
        </button>

        <button
          onClick={() => setFilter("week")}
          className={`px-4 py-2 rounded ${
            filter === "week" ? "bg-blue-600 text-white" : "bg-gray-100"
          }`}
        >
          Esta semana
        </button>

        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded ${
            filter === "all" ? "bg-blue-600 text-white" : "bg-gray-100"
          }`}
        >
          Todas
        </button>
      </div>

      {loading && (
        <div className="bg-white border rounded-xl p-4 mb-4">
          Cargando citas...
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 mb-4">
          {error}
        </div>
      )}

      {!loading && !error && filteredAppointments.length === 0 && (
        <div className="bg-white border rounded-xl p-4 mb-4">
          No hay citas para mostrar.
        </div>
      )}

      {!loading && !error && filteredAppointments.length > 0 && (
        <table className="w-full border rounded-xl overflow-hidden bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Paciente</th>
              <th className="p-3 text-left">Teléfono</th>
              <th className="p-3 text-left">Fecha</th>
              <th className="p-3 text-left">Hora</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filteredAppointments.map((appt) => (
              <tr key={appt.id} className="border-t">
                <td className="p-3">{appt.patient_name || "-"}</td>
                <td className="p-3">{appt.patient_phone || "-"}</td>
                <td className="p-3">{appt.date || "-"}</td>
                <td className="p-3">{appt.time || "-"}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-sm ${statusColor(
                      appt.status
                    )}`}
                  >
                    {translateStatus(appt.status)}
                  </span>
                </td>
                <td className="p-3">
                  {appt.status !== "canceled" && (
                    <button
                      onClick={() => cancelAppointment(appt.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}