import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MessageCircle, ShieldAlert } from "lucide-react";
import { ContactForm } from "@/components/site/contact-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { siteConfig, whatsappLink } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Message our team, chat on WhatsApp or email us. We reply within one working day, and there is no obligation.",
};

export default async function ContactPage() {
  const treatments = await db.listTreatments();

  return (
    <>
      <section className="border-b bg-secondary/40 py-12">
        <div className="container">
          <h1 className="text-3xl font-semibold sm:text-4xl">Contact us</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Ask anything — about costs, hospitals, visas, or whether travelling makes sense in your
            case. A case manager replies within one working day.
          </p>
        </div>
      </section>

      <div className="container grid gap-10 py-12 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
            <CardDescription>
              The more you tell us, the more useful our first reply will be.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContactForm treatments={treatments} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fastest ways to reach us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild variant="success" size="lg" className="w-full">
                <a
                  href={whatsappLink(
                    "Hello, I would like help arranging medical treatment in India.",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Chat on WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full">
                <a href={`mailto:${siteConfig.contactEmail}`}>
                  <Mail className="size-4" aria-hidden="true" />
                  {siteConfig.contactEmail}
                </a>
              </Button>
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Our team works India time (UTC+5:30). Messages sent overnight are answered the next
                working morning.
              </p>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-destructive">
                <ShieldAlert className="size-5" aria-hidden="true" />
                If this is a medical emergency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                We are a travel facilitator and cannot help in an emergency. Contact your local
                emergency services or go to your nearest hospital immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Already have your reports?</CardTitle>
              <CardDescription>
                Starting a case gets you a doctor&apos;s opinion much faster than a general enquiry.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/sign-in?next=%2Fintake">Start my case</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
