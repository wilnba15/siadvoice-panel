"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function HistoriaDetallePage() {
  const { id } = useParams();

  const [record, setRecord] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("siadvoice_token");
      const clinic = localStorage.getItem("siadvoice_clinic_slug");

      const res = await fetch(`${API}/medical-records/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Clinic-Slug": clinic || "",
        },
      });

      const data = await res.json();
      setRecord(data);
    };

    if (id) fetchData();
  }, [id]);

  if (!record) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Historia Clínica
      </h1>

      <div className="bg-white rounded-xl shadow p-6 space-y-4">

        <div>
          <strong>Paciente:</strong> {record.patient_name}
        </div>

        <div>
          <strong>Teléfono:</strong> {record.patient_phone}
        </div>

        <div>
          <strong>Fecha:</strong> {record.created_at}
        </div>

        <div>
          <strong>Motivo:</strong> {record.reason}
        </div>

        <div>
          <strong>Diagnóstico:</strong> {record.diagnosis || "Pendiente"}
        </div>

        <div>
          <strong>Observaciones:</strong> {record.notes || "-"}
        </div>

      </div>
    </div>
  );
}