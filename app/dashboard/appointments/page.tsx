"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function AppointmentsPage() {

  const [appointments, setAppointments] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {

    try {

      const res = await fetch(`${API}/appointments`);
      const data = await res.json();

      setAppointments(data);

    } catch (err) {

      console.error("Error cargando citas", err);

    }
  }

  async function cancelAppointment(id: number) {

    const confirmCancel = confirm("¿Seguro que deseas cancelar esta cita?");
    if (!confirmCancel) return;

    try {

      const res = await fetch(`${API}/appointments/${id}/cancel`, {
        method: "PATCH",
      });

      if (!res.ok) {
        alert("Error cancelando cita");
        return;
      }

      // actualizar UI sin recargar
      setAppointments(prev =>
        prev.map(appt =>
          appt.id === id
            ? { ...appt, status: "canceled" }
            : appt
        )
      );

    } catch (err) {

      console.error(err);
      alert("Error cancelando cita");

    }
  }

  function translateStatus(status: string) {

    if (status === "scheduled") return "Programada";
    if (status === "canceled") return "Cancelada";

    return status;
  }

  function statusColor(status: string) {

    if (status === "scheduled")
      return "bg-green-100 text-green-700";

    if (status === "canceled")
      return "bg-red-100 text-red-700";

    return "bg-gray-100";
  }

  const filteredAppointments = appointments.filter(appt => {

    if (filter === "all") return true;

    const today = new Date().toISOString().slice(0, 10);

    if (filter === "today")
      return appt.date === today;

    if (filter === "week") {

      const apptDate = new Date(appt.date);
      const now = new Date();

      const diff =
        (apptDate.getTime() - now.getTime()) /
        (1000 * 3600 * 24);

      return diff >= 0 && diff <= 7;
    }

    return true;
  });

  return (

    <div className="p-8">

      <div className="bg-blue-600 text-white p-6 rounded-xl mb-6">
        <h1 className="text-2xl font-bold">
          Gestión de Citas
        </h1>

        <p className="opacity-90">
          Citas registradas por el asistente
        </p>
      </div>

      <div className="flex gap-2 mb-4">

        <button
          onClick={() => setFilter("today")}
          className={`px-4 py-2 rounded ${
            filter === "today"
              ? "bg-blue-600 text-white"
              : "bg-gray-100"
          }`}
        >
          Hoy
        </button>

        <button
          onClick={() => setFilter("week")}
          className={`px-4 py-2 rounded ${
            filter === "week"
              ? "bg-blue-600 text-white"
              : "bg-gray-100"
          }`}
        >
          Esta semana
        </button>

        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-100"
          }`}
        >
          Todas
        </button>

      </div>

      <table className="w-full border rounded-xl overflow-hidden">

        <thead className="bg-gray-100">

          <tr>

            <th className="p-3 text-left">
              Paciente
            </th>

            <th className="p-3 text-left">
              Teléfono
            </th>

            <th className="p-3 text-left">
              Fecha
            </th>

            <th className="p-3 text-left">
              Hora
            </th>

            <th className="p-3 text-left">
              Estado
            </th>

            <th className="p-3 text-left">
              Acciones
            </th>

          </tr>

        </thead>

        <tbody>

          {filteredAppointments.map(appt => (

            <tr key={appt.id} className="border-t">

              <td className="p-3">
                {appt.patient_name}
              </td>

              <td className="p-3">
                {appt.patient_phone}
              </td>

              <td className="p-3">
                {appt.date}
              </td>

              <td className="p-3">
                {appt.time}
              </td>

              <td className="p-3">

                <span className={`px-2 py-1 rounded-full text-sm ${statusColor(appt.status)}`}>

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

    </div>

  );
}