export type ClinicTheme = {
  displayName: string;
  subtitle: string;
  specialty: string;
  initials: string;
  accent: {
    badge: string;
    soft: string;
    border: string;
    text: string;
    button: string;
    buttonHover: string;
    ring: string;
  };
};

const CLINIC_THEMES: Record<string, ClinicTheme> = {
  "clinica-valle": {
    displayName: "Clínica Valle",
    subtitle: "Panel de gestión de citas y atención",
    specialty: "Oftalmología",
    initials: "CV",
    accent: {
      badge: "bg-blue-600 text-white",
      soft: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      button: "bg-blue-600 text-white",
      buttonHover: "hover:bg-blue-700",
      ring: "ring-blue-100",
    },
  },
  "clinica-a": {
    displayName: "Clínica A",
    subtitle: "Panel administrativo multi-clínica",
    specialty: "Medicina General",
    initials: "CA",
    accent: {
      badge: "bg-emerald-600 text-white",
      soft: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      button: "bg-emerald-600 text-white",
      buttonHover: "hover:bg-emerald-700",
      ring: "ring-emerald-100",
    },
  },
  "clinica-b": {
    displayName: "Clínica B",
    subtitle: "Panel administrativo multi-clínica",
    specialty: "Especialidades Médicas",
    initials: "CB",
    accent: {
      badge: "bg-violet-600 text-white",
      soft: "bg-violet-50",
      border: "border-violet-200",
      text: "text-violet-700",
      button: "bg-violet-600 text-white",
      buttonHover: "hover:bg-violet-700",
      ring: "ring-violet-100",
    },
  },
};

function humanizeSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitialsFromSlug(slug: string) {
  const parts = slug.split("-").filter(Boolean);
  if (parts.length === 0) return "SC";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function getClinicTheme(clinicSlug?: string | null): ClinicTheme {
  const slug = (clinicSlug || "").trim().toLowerCase();

  if (slug && CLINIC_THEMES[slug]) {
    return CLINIC_THEMES[slug];
  }

  return {
    displayName: slug ? humanizeSlug(slug) : "SIADVOICE Clinic",
    subtitle: "Panel de gestión de citas",
    specialty: "Atención Médica",
    initials: slug ? getInitialsFromSlug(slug) : "SV",
    accent: {
      badge: "bg-sky-600 text-white",
      soft: "bg-sky-50",
      border: "border-sky-200",
      text: "text-sky-700",
      button: "bg-sky-600 text-white",
      buttonHover: "hover:bg-sky-700",
      ring: "ring-sky-100",
    },
  };
}