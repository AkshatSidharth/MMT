export const siteConfig = {
  name: "Mediva",
  tagline: "World-class treatment in India, arranged end to end",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "911234567890",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "care@example.com",
  /** India received around 650,000 international patients a year pre-2020 (public estimates). */
  patientsPerYear: "650,000+",
};

export function whatsappLink(message?: string) {
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${siteConfig.whatsappNumber}${text}`;
}

export const PUBLIC_NAV = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/treatments", label: "Treatments", icon: "stethoscope" },
  { href: "/hospitals", label: "Hospitals", icon: "building-2" },
  { href: "/cost-estimator", label: "Cost Estimator", icon: "calculator" },
  { href: "/how-it-works", label: "How It Works", icon: "route" },
] as const;

export const PATIENT_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/dashboard/case", label: "My Case", icon: "folder-heart" },
  { href: "/dashboard/quotes", label: "Hospitals & Quotes", icon: "clipboard-list" },
  { href: "/dashboard/consultation", label: "Consultation", icon: "video" },
  { href: "/dashboard/documents", label: "Documents", icon: "file-text" },
  { href: "/dashboard/messages", label: "Messages", icon: "message-circle" },
  { href: "/dashboard/profile", label: "Profile & KYC", icon: "user-check" },
] as const;

export const ADMIN_NAV = [
  { href: "/admin/pipeline", label: "Pipeline", icon: "kanban" },
  { href: "/admin/hospitals", label: "Hospitals", icon: "building-2" },
  { href: "/admin/doctors", label: "Doctors", icon: "user-round" },
  { href: "/admin/treatments", label: "Treatments", icon: "stethoscope" },
  { href: "/admin/cases", label: "Cases", icon: "folder-open" },
] as const;
