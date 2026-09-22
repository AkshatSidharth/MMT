import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";
import { MessageComposer } from "@/components/dashboard/message-composer";
import { MessageThread } from "@/components/dashboard/message-thread";
import { NoCaseYet } from "@/components/dashboard/no-case";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveCase } from "@/app/actions/cases";
import { requirePatient } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requirePatient();
  const activeCase = await getActiveCase(user.id);
  if (!activeCase) {
    return (
      <>
        <PageHeader title="Messages" />
        <NoCaseYet context="Start your case and you will get a named case manager to talk to here." />
      </>
    );
  }

  const messages = await db.listMessages(activeCase.id);
  const manager = activeCase.assigned_admin;

  return (
    <>
      <PageHeader
        title="Messages"
        description={
          manager
            ? `You are talking to ${manager.full_name}, your case manager for ${activeCase.reference}.`
            : `Your messages about case ${activeCase.reference}. A case manager will be assigned shortly and will reply here.`
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="size-5 text-primary" aria-hidden="true" />
            Conversation
          </CardTitle>
          <CardDescription>
            This thread is the main way we work with you. Everything is kept with your case.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <MessageThread
            messages={messages}
            viewerRole="patient"
            emptyMessage="No messages yet. Ask us anything — no question is too small."
          />
          <div className="border-t pt-6">
            <MessageComposer caseId={activeCase.id} />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
