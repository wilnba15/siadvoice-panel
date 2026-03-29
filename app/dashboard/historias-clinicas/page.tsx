"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE;

type Record = {
  id: number;
  patient_id: number;
  patient_name: string;
  created_at: string;
  motivo_consulta: string;
  diagnostico: string;
};

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadRecords() {
    const token = localStorage.getItem("siadvoice_token");
    const clinicSlug = localStorage.getItem("siadvoice_clinic_slug");

    const res = await fetch(`${API}/medical-records`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Clinic-Slug": clinicSlug || "",
      },
    });

    const data = await res.json();
    setRecords(data);
    setLoading(false);
  }

  useEffect(() => {
    loadRecords();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold">Historias Clínicas</h1>
        <p className="text-sm text-slate-500 mt-2">
          Visualiza todas las historias clínicas registradas automáticamente
        </p>
      </div>

      <div className="rounded-3xl border bg-white shadow-sm">
        {loading ? (
          <p className="p-6">Cargando...</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left">Paciente</th>
                <th className="px-5 py-4 text-left">Fecha</th>
                <th className="px-5 py-4 text-left">Motivo</th>
                <th className="px-5 py-4 text-left">Diagnóstico</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-5 py-4 font-semibold">
                    {r.patient_name}
                  </td>
                  <td className="px-5 py-4">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    {r.motivo_consulta}
                  </td>
                  <td className="px-5 py-4">
                    {r.diagnostico || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}