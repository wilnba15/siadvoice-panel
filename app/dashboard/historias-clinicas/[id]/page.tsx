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
  updated_at?: string;
  motivo_consulta?: string;
  antecedentes?: string;
  diagnostico?: string;
  observaciones?: string;
};

export default function HistoriaDetallePage() {
  const { id } = useParams();
  const router = useRouter();

  const [record, setRecord] = useState<MedicalRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    motivo_consulta: "",
    antecedentes: "",
    diagnostico: "",
    observaciones: "",
  });

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

      if (!res.ok) {
        throw new Error("No se pudo cargar la historia clínica");
      }

      const data = await res.json();
      setRecord(data);
      setForm({
        motivo_consulta: data.motivo_consulta || "",
        antecedentes: data.antecedentes || "",
        diagnostico: data.diagnostico || "",
        observaciones: data.observaciones || "",
      });
    } catch (error) {
      console.error("Error cargando detalle de historia clínica:", error);
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);

      const token = localStorage.getItem("siadvoice_token");
      const clinicSlug = localStorage.getItem("siadvoice_clinic_slug");

      const res = await fetch(`${API}/medical-records/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Clinic-Slug": clinicSlug || "",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || "No se pudo guardar la historia clínica");
      }

      const data = await res.json();
      setRecord(data);
      setForm({
        motivo_consulta: data.motivo_consulta || "",
        antecedentes: data.antecedentes || "",
        diagnostico: data.diagnostico || "",
        observaciones: data.observaciones || "",
      });
      setEditing(false);
    } catch (error) {
      console.error("Error guardando historia clínica:", error);
      alert(error instanceof Error ? error.message : "Error guardando historia clínica");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadRecord();
    }
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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Historia Clínica</h1>

        <div className="flex gap-2">
          <button
            onClick={() => router.push("/dashboard/historias-clinicas")}
            className="rounded-xl border bg-white px-4 py-2 text-sm shadow-sm hover:bg-slate-50"
          >
            ← Volver
          </button>

          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white shadow-sm hover:bg-blue-700"
            >
              ✏️ Editar
            </button>
          ) : (
            <button
              onClick={() => {
                setEditing(false);
                setForm({
                  motivo_consulta: record.motivo_consulta || "",
                  antecedentes: record.antecedentes || "",
                  diagnostico: record.diagnostico || "",
                  observaciones: record.observaciones || "",
                });
              }}
              className="rounded-xl border bg-white px-4 py-2 text-sm shadow-sm hover:bg-slate-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-6 rounded-3xl border bg-white p-8 shadow-sm">
          <div>
            <label className="mb-2 block font-semibold">Paciente</label>
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-slate-700">
              {record.patient_name || "-"}
            </div>
          </div>

          <div>
            <label className="mb-2 block font-semibold">Teléfono</label>
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-slate-700">
              {record.patient_phone || "-"}
            </div>
          </div>

          <div>
            <label className="mb-2 block font-semibold">Motivo de consulta</label>
            <textarea
              value={form.motivo_consulta}
              onChange={(e) =>
                setForm({ ...form, motivo_consulta: e.target.value })
              }
              className="min-h-[110px] w-full rounded-xl border p-3 outline-none focus:border-slate-400"
              placeholder="Escribe el motivo de consulta"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">Antecedentes</label>
            <textarea
              value={form.antecedentes}
              onChange={(e) =>
                setForm({ ...form, antecedentes: e.target.value })
              }
              className="min-h-[110px] w-full rounded-xl border p-3 outline-none focus:border-slate-400"
              placeholder="Escribe antecedentes relevantes"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">Diagnóstico</label>
            <textarea
              value={form.diagnostico}
              onChange={(e) =>
                setForm({ ...form, diagnostico: e.target.value })
              }
              className="min-h-[110px] w-full rounded-xl border p-3 outline-none focus:border-slate-400"
              placeholder="Escribe el diagnóstico"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">Observaciones</label>
            <textarea
              value={form.observaciones}
              onChange={(e) =>
                setForm({ ...form, observaciones: e.target.value })
              }
              className="min-h-[110px] w-full rounded-xl border p-3 outline-none focus:border-slate-400"
              placeholder="Escribe observaciones"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Guardando..." : "💾 Guardar cambios"}
            </button>
          </div>
        </div>
      ) : (
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
            <span className="font-bold">Antecedentes:</span>{" "}
            {record.antecedentes || "-"}
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
      )}
    </div>
  );
}