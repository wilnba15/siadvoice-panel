"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_BASE;

type Record = {
  id: number;
  patient_id: number;
  patient_name: string;
  created_at: string;
  motivo_consulta: string;
  diagnostico: string;
};

function toLocalDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function MedicalRecordsPage() {
  const router = useRouter();

  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  async function loadRecords() {
    try {
      const token = localStorage.getItem("siadvoice_token");
      const clinicSlug = localStorage.getItem("siadvoice_clinic_slug");

      const res = await fetch(`${API}/medical-records`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Clinic-Slug": clinicSlug || "",
        },
      });

      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando historias clínicas:", error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesName = r.patient_name
        ?.toLowerCase()
        .includes(search.toLowerCase());

      const recordDate = new Date(r.created_at);
      const recordOnlyDate = new Date(
        recordDate.getFullYear(),
        recordDate.getMonth(),
        recordDate.getDate()
      );

      let matchesFrom = true;
      let matchesTo = true;

      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00`);
        matchesFrom = recordOnlyDate >= from;
      }

      if (dateTo) {
        const to = new Date(`${dateTo}T00:00:00`);
        matchesTo = recordOnlyDate <= to;
      }

      return matchesName && matchesFrom && matchesTo;
    });
  }, [records, search, dateFrom, dateTo]);

  function clearFilters() {
    setSearch("");
    setDateFrom("");
    setDateTo("");
  }

  const today = toLocalDateInputValue(new Date());

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold">Historias Clínicas</h1>
        <p className="mt-2 text-sm text-slate-500">
          Visualiza todas las historias clínicas registradas automáticamente
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            type="text"
            placeholder="🔎 Buscar paciente por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-slate-400"
          />

          <div className="flex flex-col">
            <label className="mb-1 text-xs text-slate-500">Desde</label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || today}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-xs text-slate-500">Hasta</label>
            <input
              type="date"
              value={dateTo}
              max={today}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full rounded-xl border bg-white px-4 py-2 text-sm shadow-sm hover:bg-slate-50"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {!loading && (
          <p className="mt-3 text-xs text-slate-500">
            {filteredRecords.length} resultado(s)
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        {loading ? (
          <p className="p-6">Cargando...</p>
        ) : records.length === 0 ? (
          <p className="p-6 text-slate-500">
            No hay historias clínicas registradas.
          </p>
        ) : filteredRecords.length === 0 ? (
          <p className="p-6 text-slate-500">
            No se encontraron resultados con los filtros aplicados.
          </p>
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
              {filteredRecords.map((r) => (
                <tr
                  key={r.id}
                  className="cursor-pointer border-t transition hover:bg-slate-50"
                  onClick={() =>
                    router.push(`/dashboard/historias-clinicas/${r.id}`)
                  }
                  title="Ver detalle de historia clínica"
                >
                  <td className="px-5 py-4 font-semibold">{r.patient_name}</td>
                  <td className="px-5 py-4">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-4">{r.motivo_consulta}</td>
                  <td className="px-5 py-4">{r.diagnostico || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}