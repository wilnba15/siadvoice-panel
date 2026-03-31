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

type MedicalEvolutionDetail = {
  id: number;
  clinic_id: number;
  patient_id: number;
  created_at?: string;
  updated_at?: string;
  evolution_datetime?: string;
  professional_name?: string;
  professional_role?: string;
  attention_type?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  blood_pressure?: string;
  heart_rate?: string;
  respiratory_rate?: string;
  temperature?: string;
  oxygen_saturation?: string;
  weight?: string;
  glucose?: string;
  pain_scale?: string;
  diagnosis?: string;
  indications?: string;
  clinical_alerts?: string;
  next_review_date?: string;
  status?: string;
};

function StatusBadge({ status }: { status?: string }) {
  const normalized = (status || "draft").toLowerCase();
  const isFinalized = normalized === "finalized";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        isFinalized
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      {normalized}
    </span>
  );
}

function FieldBlock({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="whitespace-pre-wrap text-sm text-slate-700">
        {value && value.trim() ? value : "-"}
      </div>
    </div>
  );
}

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
  const [expandedEvolutionId, setExpandedEvolutionId] = useState<number | null>(null);
  const [evolutionDetails, setEvolutionDetails] = useState<Record<number, MedicalEvolutionDetail>>({});
  const [loadingEvolutionDetailId, setLoadingEvolutionDetailId] = useState<number | null>(null);
  const [finalizingEvolutionId, setFinalizingEvolutionId] = useState<number | null>(null);

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

  async function loadEvolutionDetail(evolutionId: number) {
    if (evolutionDetails[evolutionId]) return;

    try {
      setLoadingEvolutionDetailId(evolutionId);

      const token = localStorage.getItem("siadvoice_token");
      const clinicSlug = localStorage.getItem("siadvoice_clinic_slug");

      const res = await fetch(`${API}/medical-evolutions/${evolutionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Clinic-Slug": clinicSlug || "",
        },
      });

      if (!res.ok) {
        throw new Error("No se pudo cargar el detalle de la evolución médica");
      }

      const data = await res.json();
      setEvolutionDetails((prev) => ({ ...prev, [evolutionId]: data }));
    } catch (error) {
      console.error("Error cargando detalle de evolución médica:", error);
      alert("No se pudo cargar el detalle de la evolución médica");
    } finally {
      setLoadingEvolutionDetailId(null);
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

  async function finalizeEvolution(evolutionId: number) {
    try {
      setFinalizingEvolutionId(evolutionId);

      const token = localStorage.getItem("siadvoice_token");
      const clinicSlug = localStorage.getItem("siadvoice_clinic_slug");
      const currentDetail = evolutionDetails[evolutionId];

      const res = await fetch(`${API}/medical-evolutions/${evolutionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Clinic-Slug": clinicSlug || "",
        },
        body: JSON.stringify({
          status: "finalized",
          ...(currentDetail?.professional_name
            ? { professional_name: currentDetail.professional_name }
            : {}),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || "No se pudo finalizar la evolución");
      }

      const updated = await res.json();
      setEvolutionDetails((prev) => ({ ...prev, [evolutionId]: updated }));
      setEvolutions((prev) =>
        prev.map((item) =>
          item.id === evolutionId ? { ...item, status: updated.status } : item
        )
      );
    } catch (error) {
      console.error("Error finalizando evolución médica:", error);
      alert(error instanceof Error ? error.message : "Error finalizando evolución médica");
    } finally {
      setFinalizingEvolutionId(null);
    }
  }

  async function toggleEvolution(evolutionId: number) {
    const nextId = expandedEvolutionId === evolutionId ? null : evolutionId;
    setExpandedEvolutionId(nextId);

    if (nextId && !evolutionDetails[evolutionId]) {
      await loadEvolutionDetail(evolutionId);
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
                {evolutions.map((evo) => {
                  const isExpanded = expandedEvolutionId === evo.id;
                  const detail = evolutionDetails[evo.id];
                  const isLoadingDetail = loadingEvolutionDetailId === evo.id;
                  const isFinalized = (detail?.status || evo.status || "draft").toLowerCase() === "finalized";

                  return (
                    <div
                      key={evo.id}
                      className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => toggleEvolution(evo.id)}
                        className="w-full p-5 text-left transition hover:bg-slate-50"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-lg font-semibold text-slate-900">
                                {evo.professional_name || "Profesional no registrado"}
                              </div>
                              <StatusBadge status={detail?.status || evo.status} />
                            </div>

                            <div className="text-sm text-slate-500">
                              {evo.professional_role || "Sin rol especificado"}
                            </div>

                            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                              <span className="font-semibold">Diagnóstico / resumen:</span>{" "}
                              {evo.diagnosis || "Sin diagnóstico registrado"}
                            </div>
                          </div>

                          <div className="flex flex-col items-start gap-2 text-sm text-slate-500 md:items-end">
                            <span>
                              {evo.evolution_datetime
                                ? new Date(evo.evolution_datetime).toLocaleString()
                                : "Sin fecha"}
                            </span>
                            <span className="text-xs font-medium text-blue-600">
                              {isExpanded ? "Ocultar detalle ▲" : "Ver detalle ▼"}
                            </span>
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t bg-slate-50/70 p-5">
                          {isLoadingDetail ? (
                            <div className="rounded-2xl border border-dashed bg-white p-6 text-sm text-slate-500">
                              Cargando detalle clínico...
                            </div>
                          ) : detail ? (
                            <div className="space-y-4">
                              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl border bg-white p-4">
                                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Fecha de evolución
                                  </div>
                                  <div className="text-sm text-slate-700">
                                    {detail.evolution_datetime
                                      ? new Date(detail.evolution_datetime).toLocaleString()
                                      : "-"}
                                  </div>
                                </div>

                                <div className="rounded-2xl border bg-white p-4">
                                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Profesional
                                  </div>
                                  <div className="text-sm text-slate-700">
                                    {detail.professional_name || "-"}
                                  </div>
                                </div>

                                <div className="rounded-2xl border bg-white p-4">
                                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Rol
                                  </div>
                                  <div className="text-sm text-slate-700">
                                    {detail.professional_role || "-"}
                                  </div>
                                </div>

                                <div className="rounded-2xl border bg-white p-4">
                                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Estado
                                  </div>
                                  <div>
                                    <StatusBadge status={detail.status} />
                                  </div>
                                </div>
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                <FieldBlock label="Diagnóstico" value={detail.diagnosis} />
                                <FieldBlock label="Tipo de atención" value={detail.attention_type} />
                                <FieldBlock label="S - Subjetivo" value={detail.subjective} />
                                <FieldBlock label="O - Objetivo" value={detail.objective} />
                                <FieldBlock label="A - Evaluación" value={detail.assessment} />
                                <FieldBlock label="P - Plan" value={detail.plan} />
                                <FieldBlock label="Indicaciones" value={detail.indications} />
                                <FieldBlock label="Alertas clínicas" value={detail.clinical_alerts} />
                              </div>

                              <div className="space-y-3 rounded-2xl border bg-white p-4">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Signos vitales / mediciones
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                                    <span className="font-semibold">PA:</span> {detail.blood_pressure || "-"}
                                  </div>
                                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                                    <span className="font-semibold">FC:</span> {detail.heart_rate || "-"}
                                  </div>
                                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                                    <span className="font-semibold">FR:</span> {detail.respiratory_rate || "-"}
                                  </div>
                                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                                    <span className="font-semibold">Temp:</span> {detail.temperature || "-"}
                                  </div>
                                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                                    <span className="font-semibold">Sat O₂:</span> {detail.oxygen_saturation || "-"}
                                  </div>
                                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                                    <span className="font-semibold">Peso:</span> {detail.weight || "-"}
                                  </div>
                                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                                    <span className="font-semibold">Glucosa:</span> {detail.glucose || "-"}
                                  </div>
                                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                                    <span className="font-semibold">Dolor:</span> {detail.pain_scale || "-"}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap justify-end gap-3">
                                {!isFinalized && (
                                  <button
                                    onClick={() => finalizeEvolution(evo.id)}
                                    disabled={finalizingEvolutionId === evo.id}
                                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                                  >
                                    {finalizingEvolutionId === evo.id
                                      ? "Finalizando..."
                                      : "✅ Finalizar evolución"}
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed bg-white p-6 text-sm text-slate-500">
                              No se pudo cargar el detalle de esta evolución.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
