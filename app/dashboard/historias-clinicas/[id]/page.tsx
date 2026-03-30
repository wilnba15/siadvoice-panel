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

type MedicalEvolutionItem = {
  id: number;
  clinic_id: number;
  patient_id: number;
  patient_name?: string;
  created_at?: string;
  updated_at?: string;
  evolution_datetime?: string;
  professional_name?: string;
  professional_role?: string;
  diagnosis?: string;
  status?: string;
};

export default function HistoriaDetallePage() {
  const { id } = useParams();
  const router = useRouter();

  const [record, setRecord] = useState<MedicalRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [evolutions, setEvolutions] = useState<MedicalEvolutionItem[]>([]);
  const [loadingEvolutions, setLoadingEvolutions] = useState(true);
  const [showNewEvolution, setShowNewEvolution] = useState(false);
  const [savingEvolution, setSavingEvolution] = useState(false);

  const [form, setForm] = useState({
    motivo_consulta: "",
    antecedentes: "",
    diagnostico: "",
    observaciones: "",
  });

  const [evolutionForm, setEvolutionForm] = useState({
    professional_name: "",
    professional_role: "",
    diagnosis: "",
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });

  async function loadRecord() {
    try {
      setLoading(true);

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

  async function loadEvolutions(patientId: number) {
    try {
      setLoadingEvolutions(true);

      const token = localStorage.getItem("siadvoice_token");
      const clinicSlug = localStorage.getItem("siadvoice_clinic_slug");

      const res = await fetch(`${API}/medical-evolutions/patient/${patientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Clinic-Slug": clinicSlug || "",
        },
      });

      if (!res.ok) {
        throw new Error("No se pudieron cargar las evoluciones médicas");
      }

      const data = await res.json();
      setEvolutions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando evoluciones médicas:", error);
      setEvolutions([]);
    } finally {
      setLoadingEvolutions(false);
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

  async function createEvolution() {
    if (!record?.patient_id) {
      alert("No se encontró el paciente asociado a esta historia clínica");
      return;
    }

    if (!evolutionForm.professional_name.trim()) {
      alert("Ingresa el nombre del profesional");
      return;
    }

    try {
      setSavingEvolution(true);

      const token = localStorage.getItem("siadvoice_token");
      const clinicSlug = localStorage.getItem("siadvoice_clinic_slug");

      const res = await fetch(`${API}/medical-evolutions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Clinic-Slug": clinicSlug || "",
        },
        body: JSON.stringify({
          patient_id: record.patient_id,
          professional_name: evolutionForm.professional_name,
          professional_role: evolutionForm.professional_role || null,
          diagnosis: evolutionForm.diagnosis || null,
          subjective: evolutionForm.subjective || null,
          objective: evolutionForm.objective || null,
          assessment: evolutionForm.assessment || null,
          plan: evolutionForm.plan || null,
          status: "draft",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || "No se pudo crear la evolución médica");
      }

      setEvolutionForm({
        professional_name: "",
        professional_role: "",
        diagnosis: "",
        subjective: "",
        objective: "",
        assessment: "",
        plan: "",
      });
      setShowNewEvolution(false);
      await loadEvolutions(record.patient_id);
    } catch (error) {
      console.error("Error creando evolución médica:", error);
      alert(error instanceof Error ? error.message : "Error creando evolución médica");
    } finally {
      setSavingEvolution(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadRecord();
    }
  }, [id]);

  useEffect(() => {
    if (record?.patient_id) {
      loadEvolutions(record.patient_id);
    }
  }, [record?.patient_id]);

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
        <>
          <div className="space-y-6 rounded-3xl border bg-white p-8 shadow-sm">
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

          <div className="space-y-6 rounded-3xl border bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Evolución médica</h2>
                <p className="text-sm text-slate-500">
                  Registro cronológico de atenciones y seguimiento clínico del paciente.
                </p>
              </div>

              <button
                onClick={() => setShowNewEvolution((prev) => !prev)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white shadow-sm hover:bg-blue-700"
              >
                {showNewEvolution ? "Cerrar formulario" : "➕ Nueva evolución"}
              </button>
            </div>

            {showNewEvolution && (
              <div className="space-y-4 rounded-2xl border bg-slate-50 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Profesional
                    </label>
                    <input
                      value={evolutionForm.professional_name}
                      onChange={(e) =>
                        setEvolutionForm({
                          ...evolutionForm,
                          professional_name: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border bg-white p-3 outline-none focus:border-slate-400"
                      placeholder="Ej. Dr. Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Cargo / Rol
                    </label>
                    <input
                      value={evolutionForm.professional_role}
                      onChange={(e) =>
                        setEvolutionForm({
                          ...evolutionForm,
                          professional_role: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border bg-white p-3 outline-none focus:border-slate-400"
                      placeholder="Ej. Médico, Enfermería"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Diagnóstico / Resumen clínico
                  </label>
                  <textarea
                    value={evolutionForm.diagnosis}
                    onChange={(e) =>
                      setEvolutionForm({
                        ...evolutionForm,
                        diagnosis: e.target.value,
                      })
                    }
                    className="min-h-[90px] w-full rounded-xl border bg-white p-3 outline-none focus:border-slate-400"
                    placeholder="Resumen clínico de la evolución"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    S - Subjetivo
                  </label>
                  <textarea
                    value={evolutionForm.subjective}
                    onChange={(e) =>
                      setEvolutionForm({
                        ...evolutionForm,
                        subjective: e.target.value,
                      })
                    }
                    className="min-h-[100px] w-full rounded-xl border bg-white p-3 outline-none focus:border-slate-400"
                    placeholder="Lo que refiere el paciente"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    O - Objetivo
                  </label>
                  <textarea
                    value={evolutionForm.objective}
                    onChange={(e) =>
                      setEvolutionForm({
                        ...evolutionForm,
                        objective: e.target.value,
                      })
                    }
                    className="min-h-[100px] w-full rounded-xl border bg-white p-3 outline-none focus:border-slate-400"
                    placeholder="Hallazgos observables y datos objetivos"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    A - Evaluación
                  </label>
                  <textarea
                    value={evolutionForm.assessment}
                    onChange={(e) =>
                      setEvolutionForm({
                        ...evolutionForm,
                        assessment: e.target.value,
                      })
                    }
                    className="min-h-[100px] w-full rounded-xl border bg-white p-3 outline-none focus:border-slate-400"
                    placeholder="Valoración clínica"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    P - Plan
                  </label>
                  <textarea
                    value={evolutionForm.plan}
                    onChange={(e) =>
                      setEvolutionForm({
                        ...evolutionForm,
                        plan: e.target.value,
                      })
                    }
                    className="min-h-[100px] w-full rounded-xl border bg-white p-3 outline-none focus:border-slate-400"
                    placeholder="Conducta, tratamiento y seguimiento"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={createEvolution}
                    disabled={savingEvolution}
                    className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {savingEvolution ? "Guardando..." : "💾 Guardar evolución"}
                  </button>
                </div>
              </div>
            )}

            {loadingEvolutions ? (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-slate-500">
                Cargando evoluciones médicas...
              </div>
            ) : evolutions.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-slate-500">
                No hay evoluciones registradas para este paciente.
              </div>
            ) : (
              <div className="space-y-4">
                {evolutions.map((evo) => (
                  <div
                    key={evo.id}
                    className="rounded-2xl border bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-base font-semibold">
                          {evo.professional_name || "Profesional no registrado"}
                        </div>
                        <div className="text-sm text-slate-500">
                          {evo.professional_role || "Sin rol especificado"}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 text-sm text-slate-500 md:items-end">
                        <span>
                          {evo.evolution_datetime
                            ? new Date(evo.evolution_datetime).toLocaleString()
                            : "Sin fecha"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {evo.status || "draft"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                      <span className="font-semibold">Diagnóstico / resumen:</span>{" "}
                      {evo.diagnosis || "Sin diagnóstico registrado"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
