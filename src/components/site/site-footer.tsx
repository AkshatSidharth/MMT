import Link from "next/link";
import { HeartPulse, Mail, MessageCircle } from "lucide-react";
import { siteConfig, whatsappLink } from "@/lib/site-config";

const columns = [
  {
    title: "Treatments",
    links: [
      { href: "/treatments/heart-bypass-surgery", label: "Heart bypass" },
      { href: "/treatments/knee-replacement", label: "Knee replacement" },
      { href: "/treatments/liver-transplant", label: "Liver transplant" },
      { href: "/treatments/cancer-treatment", label: "Cancer care" },
      { href: "/treatments", label: "All treatments" },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/hospitals", label: "Hospital directory" },
      { href: "/cost-estimator", label: "Cost estimator" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/about", label: "About us" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact us" },
      { href: "/sign-in", label: "Patient sign in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-secondary/40">
      <div className="container grid gap-10 py-12 md:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <HeartPulse className="size-6 text-primary" aria-hidden="true" />
            <span className="text-lg">{siteConfig.name}</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            We help international patients reach accredited hospitals in India — one case manager,
            one clear quote, from first question to aftercare.
          </p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <a
              href={whatsappLink("Hello, I would like help arranging treatment in India.")}
              className="inline-flex items-center gap-2 text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Chat on WhatsApp
            </a>
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Mail className="size-4" aria-hidden="true" />
              {siteConfig.contactEmail}
            </a>
          </div>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {column.title}
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-primary hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t">
        <div className="container flex flex-col gap-2 py-6 text-xs text-muted-foreground">
          <p>
            {siteConfig.name} is a medical travel facilitator. We are not a hospital and we do not
            provide medical advice, diagnosis or treatment. Treatment decisions are made by the
            treating doctor and the patient.
          </p>
          <p>
            All hospital, doctor and cost information on this site is reference material compiled
            from publicly available sources and is shown as indicative. It is not live bookable
            inventory, and it is not a quotation.
          </p>
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
