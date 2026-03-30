"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE;

type MedicalRecordDetail = {
  id: number;
  patient_id: number;
  patient_name?: string;
  patient_phone?: string;
  created_at?: string;
  motivo_consulta?: string;
  diagnostico?: string;
  observaciones?: string;
};

export default function HistoriaDetallePage() {
  const { id } = useParams();
  const router = useRouter();

  const [record, setRecord] = useState<MedicalRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecord() {
      try {
        const token = localStorage.getItem("siadvoice_token");
        const clinicSlug = localStorage.getItem("siadvoice_clinic_slug");

        const res = await fetch(`${API}/medical-records/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Clinic-Slug": clinicSlug || "",
          },
        });

        const data = await res.json();
        console.log("Detalle historia clínica:", data);
        setRecord(data);
      } catch (error) {
        console.error("Error cargando detalle de historia clínica:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) loadRecord();
  }, [id]);

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  if (!record) {
    return (
      <div className="space-y-6 p-6">
        <button
          onClick={() => router.push("/dashboard/historias-clinicas")}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50"
        >
          ← Volver
        </button>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          No se encontró la historia clínica.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Historia Clínica</h1>
        <button
          onClick={() => router.push("/dashboard/historias-clinicas")}
          className="rounded-xl border bg-white px-4 py-2 text-sm shadow-sm hover:bg-slate-50"
        >
          ← Volver
        </button>
      </div>

      <div className="rounded-3xl border bg-white p-8 shadow-sm space-y-6">
        <div>
          <span className="font-bold">Paciente:</span>{" "}
          {record.patient_name || "-"}
        </div>

        <div>
          <span className="font-bold">Teléfono:</span>{" "}
          {record.patient_phone || "-"}
        </div>

        <div>
          <span className="font-bold">Fecha:</span>{" "}
          {record.created_at
            ? new Date(record.created_at).toLocaleString()
            : "-"}
        </div>

        <div>
          <span className="font-bold">Motivo:</span>{" "}
          {record.motivo_consulta || "-"}
        </div>

        <div>
          <span className="font-bold">Diagnóstico:</span>{" "}
          {record.diagnostico || "Pendiente"}
        </div>

        <div>
          <span className="font-bold">Observaciones:</span>{" "}
          {record.observaciones || "-"}
        </div>
      </div>
    </div>
  );
}