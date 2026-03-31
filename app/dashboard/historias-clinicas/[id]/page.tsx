"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE;
const ECUADOR_TZ = "America/Guayaquil";

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

type EvolutionFormState = {
  professional_name: string;
  professional_role: string;
  evolution_datetime: string;
  attention_type: string;
  diagnosis: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  indications: string;
  clinical_alerts: string;
  next_review_date: string;
  blood_pressure: string;
  heart_rate: string;
  respiratory_rate: string;
  temperature: string;
  oxygen_saturation: string;
  weight: string;
  glucose: string;
  pain_scale: string;
};

function emptyEvolutionForm(): EvolutionFormState {
  return {
    professional_name: "",
    professional_role: "",
    evolution_datetime: "",
    attention_type: "",
    diagnosis: "",
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    indications: "",
    clinical_alerts: "",
    next_review_date: "",
    blood_pressure: "",
    heart_rate: "",
    respiratory_rate: "",
    temperature: "",
    oxygen_saturation: "",
    weight: "",
    glucose: "",
    pain_scale: "",
  };
}

function formatDateEC(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-EC", {
    timeZone: ECUADOR_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function toDatetimeLocalValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: ECUADOR_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

function datetimeLocalToIso(value?: string) {
  if (!value) return null;
  return `${value}:00-05:00`;
}

function statusLabel(status?: string) {
  const normalized = (status || "draft").toLowerCase();
  if (normalized === "finalized") return "Finalizada";
  return "Borrador";
}

function statusClasses(status?: string) {
  const normalized = (status || "draft").toLowerCase();
  return normalized === "finalized"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-slate-100 text-slate-700";
}

function StatusBadge({ status }: { status?: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(status)}`}
    >
      {statusLabel(status)}
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

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border bg-white p-3 outline-none focus:border-slate-400"
        placeholder={placeholder}
      />
    </div>
  );
}

function TextAreaInput({
  label,
  value,
  onChange,
  placeholder,
  minHeight = "min-h-[100px]",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${minHeight} w-full rounded-xl border bg-white p-3 outline-none focus:border-slate-400`}
        placeholder={placeholder}
      />
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
  const [showEvolutionForm, setShowEvolutionForm] = useState(false);
  const [savingEvolution, setSavingEvolution] = useState(false);
  const [expandedEvolutionId, setExpandedEvolutionId] = useState<number | null>(null);
  const [evolutionDetails, setEvolutionDetails] = useState<Record<number, MedicalEvolutionDetail>>({});
  const [loadingEvolutionDetailId, setLoadingEvolutionDetailId] = useState<number | null>(null);
  const [finalizingEvolutionId, setFinalizingEvolutionId] = useState<number | null>(null);
  const [editingEvolutionId, setEditingEvolutionId] = useState<number | null>(null);

  const [form, setForm] = useState({
    motivo_consulta: "",
    antecedentes: "",
    diagnostico: "",
    observaciones: "",
  });

  const [evolutionForm, setEvolutionForm] = useState<EvolutionFormState>(emptyEvolutionForm());

  const isEditingEvolution = useMemo(() => editingEvolutionId !== null, [editingEvolutionId]);

  function updateEvolutionForm<K extends keyof EvolutionFormState>(key: K, value: EvolutionFormState[K]) {
    setEvolutionForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetEvolutionForm() {
    setEvolutionForm(emptyEvolutionForm());
    setEditingEvolutionId(null);
  }

  function openNewEvolutionForm() {
    resetEvolutionForm();
    setShowEvolutionForm(true);
  }

  function closeEvolutionForm() {
    setShowEvolutionForm(false);
    resetEvolutionForm();
  }

  function fillEvolutionFormFromDetail(detail: MedicalEvolutionDetail) {
    setEvolutionForm({
      professional_name: detail.professional_name || "",
      professional_role: detail.professional_role || "",
      evolution_datetime: toDatetimeLocalValue(detail.evolution_datetime),
      attention_type: detail.attention_type || "",
      diagnosis: detail.diagnosis || "",
      subjective: detail.subjective || "",
      objective: detail.objective || "",
      assessment: detail.assessment || "",
      plan: detail.plan || "",
      indications: detail.indications || "",
      clinical_alerts: detail.clinical_alerts || "",
      next_review_date: toDatetimeLocalValue(detail.next_review_date),
      blood_pressure: detail.blood_pressure || "",
      heart_rate: detail.heart_rate || "",
      respiratory_rate: detail.respiratory_rate || "",
      temperature: detail.temperature || "",
      oxygen_saturation: detail.oxygen_saturation || "",
      weight: detail.weight || "",
      glucose: detail.glucose || "",
      pain_scale: detail.pain_scale || "",
    });
  }

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

  async function loadEvolutionDetail(evolutionId: number, force = false) {
    if (!force && evolutionDetails[evolutionId]) return evolutionDetails[evolutionId];

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
      return data as MedicalEvolutionDetail;
    } catch (error) {
      console.error("Error cargando detalle de evolución médica:", error);
      alert("No se pudo cargar el detalle de la evolución médica");
      return null;
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

  function buildEvolutionPayload() {
    return {
      patient_id: record?.patient_id,
      professional_name: evolutionForm.professional_name.trim(),
      professional_role: evolutionForm.professional_role.trim() || null,
      evolution_datetime: datetimeLocalToIso(evolutionForm.evolution_datetime),
      attention_type: evolutionForm.attention_type.trim() || null,
      diagnosis: evolutionForm.diagnosis.trim() || null,
      subjective: evolutionForm.subjective.trim() || null,
      objective: evolutionForm.objective.trim() || null,
      assessment: evolutionForm.assessment.trim() || null,
      plan: evolutionForm.plan.trim() || null,
      indications: evolutionForm.indications.trim() || null,
      clinical_alerts: evolutionForm.clinical_alerts.trim() || null,
      next_review_date: datetimeLocalToIso(evolutionForm.next_review_date),
      blood_pressure: evolutionForm.blood_pressure.trim() || null,
      heart_rate: evolutionForm.heart_rate.trim() || null,
      respiratory_rate: evolutionForm.respiratory_rate.trim() || null,
      temperature: evolutionForm.temperature.trim() || null,
      oxygen_saturation: evolutionForm.oxygen_saturation.trim() || null,
      weight: evolutionForm.weight.trim() || null,
      glucose: evolutionForm.glucose.trim() || null,
      pain_scale: evolutionForm.pain_scale.trim() || null,
      status: "draft",
    };
  }

  async function submitEvolutionForm() {
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
      const payload = buildEvolutionPayload();

      const url = editingEvolutionId
        ? `${API}/medical-evolutions/${editingEvolutionId}`
        : `${API}/medical-evolutions`;

      const method = editingEvolutionId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "X-Clinic-Slug": clinicSlug || "",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.detail ||
            (editingEvolutionId
              ? "No se pudo actualizar la evolución médica"
              : "No se pudo crear la evolución médica")
        );
      }

      const saved = await res.json();

      if (editingEvolutionId) {
        setEvolutionDetails((prev) => ({ ...prev, [editingEvolutionId]: saved }));
      } else if (saved?.id) {
        setEvolutionDetails((prev) => ({ ...prev, [saved.id]: saved }));
        setExpandedEvolutionId(saved.id);
      }

      closeEvolutionForm();
      await loadEvolutions(record.patient_id);
    } catch (error) {
      console.error("Error guardando evolución médica:", error);
      alert(error instanceof Error ? error.message : "Error guardando evolución médica");
    } finally {
      setSavingEvolution(false);
    }
  }

  async function startEditEvolution(evolutionId: number) {
    const detail = await loadEvolutionDetail(evolutionId);
    if (!detail) return;

    fillEvolutionFormFromDetail(detail);
    setEditingEvolutionId(evolutionId);
    setShowEvolutionForm(true);
    setExpandedEvolutionId(evolutionId);
  }

  async function finalizeEvolution(evolutionId: number) {
    try {
      setFinalizingEvolutionId(evolutionId);

      const token = localStorage.getItem("siadvoice_token");
      const clinicSlug = localStorage.getItem("siadvoice_clinic_slug");
      const currentDetail = (await loadEvolutionDetail(evolutionId)) || evolutionDetails[evolutionId];

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
          item.id === evolutionId
            ? {
                ...item,
                status: updated.status,
                diagnosis: updated.diagnosis,
                professional_name: updated.professional_name,
                professional_role: updated.professional_role,
                evolution_datetime: updated.evolution_datetime,
              }
            : item
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

    if (nextId) {
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
              onChange={(e) => setForm({ ...form, motivo_consulta: e.target.value })}
              className="min-h-[110px] w-full rounded-xl border p-3 outline-none focus:border-slate-400"
              placeholder="Escribe el motivo de consulta"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">Antecedentes</label>
            <textarea
              value={form.antecedentes}
              onChange={(e) => setForm({ ...form, antecedentes: e.target.value })}
              className="min-h-[110px] w-full rounded-xl border p-3 outline-none focus:border-slate-400"
              placeholder="Escribe antecedentes relevantes"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">Diagnóstico</label>
            <textarea
              value={form.diagnostico}
              onChange={(e) => setForm({ ...form, diagnostico: e.target.value })}
              className="min-h-[110px] w-full rounded-xl border p-3 outline-none focus:border-slate-400"
              placeholder="Escribe el diagnóstico"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">Observaciones</label>
            <textarea
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
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
              <span className="font-bold">Paciente:</span> {record.patient_name || "-"}
            </div>

            <div>
              <span className="font-bold">Teléfono:</span> {record.patient_phone || "-"}
            </div>

            <div>
              <span className="font-bold">Fecha:</span> {formatDateEC(record.created_at)}
            </div>

            <div>
              <span className="font-bold">Motivo:</span> {record.motivo_consulta || "-"}
            </div>

            <div>
              <span className="font-bold">Antecedentes:</span> {record.antecedentes || "-"}
            </div>

            <div>
              <span className="font-bold">Diagnóstico:</span> {record.diagnostico || "Pendiente"}
            </div>

            <div>
              <span className="font-bold">Observaciones:</span> {record.observaciones || "-"}
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
                onClick={() => (showEvolutionForm ? closeEvolutionForm() : openNewEvolutionForm())}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white shadow-sm hover:bg-blue-700"
              >
                {showEvolutionForm
                  ? isEditingEvolution
                    ? "Cancelar edición"
                    : "Cerrar formulario"
                  : "➕ Nueva evolución"}
              </button>
            </div>

            {showEvolutionForm && (
              <div className="space-y-5 rounded-2xl border bg-slate-50 p-5">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {isEditingEvolution ? "Editar evolución médica" : "Nueva evolución médica"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {isEditingEvolution
                      ? "Actualiza la evolución seleccionada y guarda los cambios."
                      : "Completa los datos clínicos para registrar una nueva evolución."}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <TextInput
                    label="Profesional"
                    value={evolutionForm.professional_name}
                    onChange={(value) => updateEvolutionForm("professional_name", value)}
                    placeholder="Ej. Dr. Juan Pérez"
                  />
                  <TextInput
                    label="Cargo / Rol"
                    value={evolutionForm.professional_role}
                    onChange={(value) => updateEvolutionForm("professional_role", value)}
                    placeholder="Ej. Médico, Enfermería"
                  />
                  <TextInput
                    label="Fecha y hora de evolución"
                    type="datetime-local"
                    value={evolutionForm.evolution_datetime}
                    onChange={(value) => updateEvolutionForm("evolution_datetime", value)}
                  />
                  <TextInput
                    label="Tipo de atención"
                    value={evolutionForm.attention_type}
                    onChange={(value) => updateEvolutionForm("attention_type", value)}
                    placeholder="Ej. Control, Urgencia, Seguimiento"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <TextAreaInput
                    label="Diagnóstico / Resumen clínico"
                    value={evolutionForm.diagnosis}
                    onChange={(value) => updateEvolutionForm("diagnosis", value)}
                    placeholder="Resumen clínico de la evolución"
                    minHeight="min-h-[90px]"
                  />
                  <TextAreaInput
                    label="Indicaciones"
                    value={evolutionForm.indications}
                    onChange={(value) => updateEvolutionForm("indications", value)}
                    placeholder="Indicaciones para el paciente"
                    minHeight="min-h-[90px]"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <TextAreaInput
                    label="S - Subjetivo"
                    value={evolutionForm.subjective}
                    onChange={(value) => updateEvolutionForm("subjective", value)}
                    placeholder="Lo que refiere el paciente"
                  />
                  <TextAreaInput
                    label="O - Objetivo"
                    value={evolutionForm.objective}
                    onChange={(value) => updateEvolutionForm("objective", value)}
                    placeholder="Hallazgos observables y datos objetivos"
                  />
                  <TextAreaInput
                    label="A - Evaluación"
                    value={evolutionForm.assessment}
                    onChange={(value) => updateEvolutionForm("assessment", value)}
                    placeholder="Valoración clínica"
                  />
                  <TextAreaInput
                    label="P - Plan"
                    value={evolutionForm.plan}
                    onChange={(value) => updateEvolutionForm("plan", value)}
                    placeholder="Conducta, tratamiento y seguimiento"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <TextAreaInput
                    label="Alertas clínicas"
                    value={evolutionForm.clinical_alerts}
                    onChange={(value) => updateEvolutionForm("clinical_alerts", value)}
                    placeholder="Alertas o banderas clínicas"
                    minHeight="min-h-[90px]"
                  />
                  <TextInput
                    label="Próxima revisión"
                    type="datetime-local"
                    value={evolutionForm.next_review_date}
                    onChange={(value) => updateEvolutionForm("next_review_date", value)}
                  />
                </div>

                <div className="space-y-3 rounded-2xl border bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Signos vitales / mediciones
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <TextInput
                      label="Presión arterial"
                      value={evolutionForm.blood_pressure}
                      onChange={(value) => updateEvolutionForm("blood_pressure", value)}
                      placeholder="Ej. 120/80"
                    />
                    <TextInput
                      label="Frecuencia cardiaca"
                      value={evolutionForm.heart_rate}
                      onChange={(value) => updateEvolutionForm("heart_rate", value)}
                      placeholder="Ej. 72"
                    />
                    <TextInput
                      label="Frecuencia respiratoria"
                      value={evolutionForm.respiratory_rate}
                      onChange={(value) => updateEvolutionForm("respiratory_rate", value)}
                      placeholder="Ej. 18"
                    />
                    <TextInput
                      label="Temperatura"
                      value={evolutionForm.temperature}
                      onChange={(value) => updateEvolutionForm("temperature", value)}
                      placeholder="Ej. 36.5"
                    />
                    <TextInput
                      label="Saturación O₂"
                      value={evolutionForm.oxygen_saturation}
                      onChange={(value) => updateEvolutionForm("oxygen_saturation", value)}
                      placeholder="Ej. 98"
                    />
                    <TextInput
                      label="Peso"
                      value={evolutionForm.weight}
                      onChange={(value) => updateEvolutionForm("weight", value)}
                      placeholder="Ej. 70 kg"
                    />
                    <TextInput
                      label="Glucosa"
                      value={evolutionForm.glucose}
                      onChange={(value) => updateEvolutionForm("glucose", value)}
                      placeholder="Ej. 95"
                    />
                    <TextInput
                      label="Escala de dolor"
                      value={evolutionForm.pain_scale}
                      onChange={(value) => updateEvolutionForm("pain_scale", value)}
                      placeholder="Ej. 3/10"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed bg-white p-4 text-sm text-slate-600">
                  <div className="font-semibold text-slate-800">Adjuntos / fotografías</div>
                  <div className="mt-1">
                    La carga de archivos sí es posible, pero necesita backend adicional para upload y almacenamiento.
                    En esta versión queda listo el módulo clínico; en el siguiente sprint podemos agregar fotos y archivos.
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    onClick={closeEvolutionForm}
                    className="rounded-xl border bg-white px-4 py-2 text-sm shadow-sm hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={submitEvolutionForm}
                    disabled={savingEvolution}
                    className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {savingEvolution
                      ? "Guardando..."
                      : isEditingEvolution
                      ? "💾 Guardar cambios"
                      : "💾 Guardar evolución"}
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
                  const currentStatus = detail?.status || evo.status || "draft";
                  const isFinalized = currentStatus.toLowerCase() === "finalized";

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
                              <StatusBadge status={currentStatus} />
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
                            <span>{formatDateEC(evo.evolution_datetime)}</span>
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
                                    {formatDateEC(detail.evolution_datetime)}
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

                              <div className="grid gap-4 md:grid-cols-2">
                                <FieldBlock
                                  label="Próxima revisión"
                                  value={detail.next_review_date ? formatDateEC(detail.next_review_date) : "-"}
                                />
                                <FieldBlock
                                  label="Adjuntos / fotografías"
                                  value="Pendiente de implementar en backend para permitir carga real de archivos."
                                />
                              </div>

                              <div className="flex flex-wrap justify-end gap-3">
                                {!isFinalized && (
                                  <button
                                    onClick={() => startEditEvolution(evo.id)}
                                    className="rounded-xl border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50"
                                  >
                                    ✏️ Editar evolución
                                  </button>
                                )}

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
