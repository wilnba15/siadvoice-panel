"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getClinicTheme } from "@/lib/clinic-theme";

const API = process.env.NEXT_PUBLIC_API_BASE;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clinicSlug, setClinicSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const previewTheme = useMemo(
    () => getClinicTheme(clinicSlug.trim().toLowerCase()),
    [clinicSlug]
  );

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      if (!API) {
        setError("Falta NEXT_PUBLIC_API_BASE en .env.local");
        return;
      }

      if (!email || !password || !clinicSlug) {
        setError("Completa correo, contraseña y clínica");
        return;
      }

      const normalizedClinicSlug = clinicSlug.trim().toLowerCase();

      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Clinic-Slug": normalizedClinicSlug,
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "No se pudo iniciar sesión");
      }

      localStorage.setItem("siadvoice_token", data.access_token);
      localStorage.setItem("token", data.access_token);

      localStorage.setItem(
        "siadvoice_clinic_slug",
        data.clinic_slug || normalizedClinicSlug
      );
      localStorage.setItem(
        "clinic_slug",
        data.clinic_slug || normalizedClinicSlug
      );

      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err?.message || "Error de login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-white px-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-2">
        <div className="hidden bg-slate-950 p-10 text-white lg:block">
          <div className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
            SIADVOICE STAGING
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full border ${previewTheme.accent.border} ${previewTheme.accent.soft} text-2xl font-bold ${previewTheme.accent.text}`}
            >
              {previewTheme.initials}
            </div>

            <div>
              <h1 className="text-3xl font-bold">{previewTheme.displayName}</h1>
              <p className="mt-2 text-slate-400">{previewTheme.specialty}</p>
            </div>
          </div>

          <p className="mt-8 max-w-md text-slate-300">
            Acceso administrativo por clínica para gestión de citas, seguimiento
            de pacientes y operación del asistente virtual.
          </p>

          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Vista previa dinámica
            </p>
            <p className="mt-2 text-sm font-medium text-slate-200">
              {previewTheme.displayName}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {previewTheme.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 md:p-10">
          <Card className="w-full max-w-md border-0 shadow-none">
            <CardContent className="space-y-5 p-0">
              <div className="text-center">
                <div
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border ${previewTheme.accent.border} ${previewTheme.accent.soft} text-xl font-bold ${previewTheme.accent.text}`}
                >
                  {previewTheme.initials}
                </div>

                <h2 className="mt-4 text-3xl font-bold text-slate-900">
                  Iniciar sesión
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Acceso por clínica a SIADVOICE Admin
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  placeholder="Slug de clínica (ej: clinica-valle)"
                  value={clinicSlug}
                  onChange={(e) => setClinicSlug(e.target.value)}
                />

                <Input
                  placeholder="Correo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLogin();
                  }}
                />
              </div>

              <div
                className={`rounded-2xl border p-4 ${previewTheme.accent.border} ${previewTheme.accent.soft}`}
              >
                <p className={`text-sm font-semibold ${previewTheme.accent.text}`}>
                  Clínica detectada
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {previewTheme.displayName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Especialidad: {previewTheme.specialty}
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                className={`w-full ${previewTheme.accent.button} ${previewTheme.accent.buttonHover}`}
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? "Ingresando..." : "Iniciar sesión"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}