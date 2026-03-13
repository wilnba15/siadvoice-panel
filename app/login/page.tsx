"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const API = process.env.NEXT_PUBLIC_API_BASE

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [clinicSlug, setClinicSlug] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async () => {
    try {
      setLoading(true)
      setError("")

      if (!API) {
        setError("Falta NEXT_PUBLIC_API_BASE en .env.local")
        return
      }

      if (!email || !password || !clinicSlug) {
        setError("Completa correo, contraseña y clínica")
        return
      }

      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Clinic-Slug": clinicSlug.trim().toLowerCase(),
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.detail || "No se pudo iniciar sesión")
      }

      localStorage.setItem("siadvoice_token", data.access_token)
      localStorage.setItem("token", data.access_token)

      localStorage.setItem(
        "siadvoice_clinic_slug",
        data.clinic_slug || clinicSlug.trim().toLowerCase()
      )
      localStorage.setItem(
        "clinic_slug",
        data.clinic_slug || clinicSlug.trim().toLowerCase()
      )

      window.location.href = "/dashboard"
    } catch (err: any) {
      setError(err?.message || "Error de login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md p-6">
        <CardContent className="space-y-4">
          <h2 className="text-2xl font-bold text-center">SIADVOICE Admin</h2>
          <p className="text-sm text-gray-500 text-center">
            Acceso por clínica
          </p>

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
              if (e.key === "Enter") handleLogin()
            }}
          />

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}