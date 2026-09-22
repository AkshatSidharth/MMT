import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FAQS } from "@/lib/content";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Visas, safety, payments, medical records, languages, and what it costs to use us — answered plainly.",
};

export default function FaqPage() {
  const categories = [...new Set(FAQS.map((faq) => faq.category))];

  return (
    <>
      <section className="border-b bg-secondary/40 py-12">
        <div className="container">
          <h1 className="text-3xl font-semibold sm:text-4xl">Frequently asked questions</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Straight answers, including to the questions facilitators usually avoid. If yours is not
            here, ask us.
          </p>
          <nav aria-label="FAQ sections" className="mt-6 flex flex-wrap gap-2">
            {categories.map((category) => (
              <a
                key={category}
                href={`#${encodeURIComponent(category)}`}
                className="rounded-full border bg-background px-3 py-1.5 text-sm hover:border-primary hover:text-primary"
              >
                {category}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="container py-12">
        <div className="max-w-3xl">
          {categories.map((category) => (
            <section key={category} id={encodeURIComponent(category)} className="mb-12 scroll-mt-24">
              <h2 className="text-2xl font-semibold">{category}</h2>
              <dl className="mt-5 space-y-6">
                {FAQS.filter((faq) => faq.category === category).map((faq) => (
                  <div key={faq.question} className="border-b pb-6 last:border-0">
                    <dt className="text-lg font-semibold">{faq.question}</dt>
                    <dd className="mt-2 text-muted-foreground">{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}

          <div className="rounded-lg border bg-secondary/40 p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Still have a question?</h2>
            <p className="mt-2 text-muted-foreground">
              Message us and a case manager will answer within one working day — no obligation to go
              any further.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/contact">Contact us</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/cost-estimator">Get a free estimate</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
