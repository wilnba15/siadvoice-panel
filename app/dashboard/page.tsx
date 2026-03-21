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

// ================= HELPERS =================

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function isPast(date?: string) {
  if (!date) return false;
  return date < todayISO();
}

function safePercent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

// ================= COMPONENT =================

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clinicSlug, setClinicSlug] = useState("");
  const [loading, setLoading] = useState(true);

  const clinicTheme = useMemo(() => getClinicTheme(clinicSlug), [clinicSlug]);

  useEffect(() => {
    const token = localStorage.getItem("siadvoice_token");
    const slug = localStorage.getItem("siadvoice_clinic_slug") || "";

    setClinicSlug(slug);

    if (!token) {
      window.location.href = "/login";
      return;
    }

    (async () => {
      const res = await fetch(`${API}/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Clinic-Slug": slug,
        },
      });

      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : data.items ?? []);
      setLoading(false);
    })();
  }, []);

    // ================= KPI V2 =================

  const metrics = useMemo(() => {
    const total = appointments.length;

    const today = appointments.filter(a => a.date === todayISO()).length;

    const pendingToday = appointments.filter(
      a => a.date === todayISO() && a.status === "scheduled"
    ).length;

    const completed = appointments.filter(a => a.status === "completed").length;
    const canceled = appointments.filter(a => a.status === "canceled").length;

    const overdue = appointments.filter(
      a => a.status === "scheduled" && isPast(a.date)
    ).length;

    const uniquePatients = new Set(
      appointments.map(a => a.patient_phone)
    ).size;

    const attendanceRate = safePercent(completed, total);

    // horario más usado
    const hours: Record<string, number> = {};
    appointments.forEach(a => {
      if (!a.time) return;
      hours[a.time] = (hours[a.time] || 0) + 1;
    });

    const topHour = Object.entries(hours).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    return {
      total,
      today,
      pendingToday,
      completed,
      canceled,
      overdue,
      uniquePatients,
      attendanceRate,
      topHour,
    };
  }, [appointments]);

    if (loading) return <div className="p-6">Cargando...</div>;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="p-6 bg-white rounded-3xl shadow">
        <h1 className="text-2xl font-bold">{clinicTheme.displayName}</h1>
        <p className="text-sm text-gray-500">
          Dashboard ejecutivo KPI v2
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <Card title="Citas hoy" value={metrics.today} />
        <Card title="Pendientes hoy" value={metrics.pendingToday} />
        <Card title="Pacientes únicos" value={metrics.uniquePatients} />
        <Card title="Citas vencidas" value={metrics.overdue} />

        <Card title="Completadas" value={metrics.completed} />
        <Card title="Canceladas" value={metrics.canceled} />
        <Card title="Asistencia" value={`${metrics.attendanceRate}%`} />
        <Card title="Hora pico" value={metrics.topHour} />

      </div>

    </div>
  );
}

// ================= COMPONENT CARD =================

function Card({ title, value }: { title: string; value: any }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow border">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}