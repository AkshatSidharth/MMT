"use client";

import { useActionState } from "react";
import { Info, Loader2, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  demoSignInAction,
  localEmailSignInAction,
  requestPhoneOtpAction,
  verifyPhoneOtpAction,
  type AuthState,
} from "@/app/actions/auth";
import { GoogleMark, OrDivider } from "./shared";

/**
 * Sign-in for the local fallback mode (no Supabase credentials configured).
 * Google OAuth and real SMS need a provider, so email identification and an
 * on-screen OTP stand in — both clearly labelled as development-only.
 */
export function LocalSignIn({ next }: { next: string }) {
  const [emailState, emailAction, emailPending] = useActionState<AuthState, FormData>(
    localEmailSignInAction,
    {},
  );
  const [requestState, requestAction, requestPending] = useActionState<AuthState, FormData>(
    requestPhoneOtpAction,
    {},
  );
  const [verifyState, verifyAction, verifyPending] = useActionState<AuthState, FormData>(
    verifyPhoneOtpAction,
    {},
  );

  const phone = verifyState.phone ?? requestState.phone;
  const showCodeStep = Boolean(phone);
  const devCode = requestState.devCode;

  return (
    <div className="space-y-6">
      <p className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning-subtle p-3 text-sm text-warning">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          <strong className="font-semibold">Development mode.</strong> Supabase is not configured,
          so Google sign-in and SMS delivery are stubbed: enter an email to identify yourself, or
          request a code and it will be shown on screen. Add your Supabase keys to enable the real
          providers.
        </span>
      </p>

      <form action={emailAction} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
        <Label htmlFor="full_name">Full name (optional)</Label>
        <Input id="full_name" name="full_name" autoComplete="name" placeholder="Your name" />
        <Button type="submit" variant="outline" size="lg" className="w-full" disabled={emailPending}>
          {emailPending ? <Loader2 className="size-4 animate-spin" /> : <GoogleMark />}
          Continue with email (stands in for Google)
        </Button>
        {emailState.error && (
          <p role="alert" className="text-sm text-destructive">
            {emailState.error}
          </p>
        )}
      </form>

      <OrDivider />

      {!showCodeStep ? (
        <form action={requestAction} className="space-y-3">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder="+234 802 000 0000"
          />
          <p className="text-sm text-muted-foreground">
            Include your country code. We send a 6-digit code.
          </p>
          <Button type="submit" size="lg" className="w-full" disabled={requestPending}>
            {requestPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Phone className="size-4" />
            )}
            Send me a code
          </Button>
          {requestState.error && (
            <p role="alert" className="text-sm text-destructive">
              {requestState.error}
            </p>
          )}
        </form>
      ) : (
        <form action={verifyAction} className="space-y-3">
          <input type="hidden" name="next" value={next} />
          <input type="hidden" name="phone" value={phone} />
          {devCode && (
            <p className="rounded-md bg-primary-subtle p-3 text-sm text-primary">
              Development code for {phone}: <strong className="font-mono">{devCode}</strong>
            </p>
          )}
          <Label htmlFor="code">Enter the 6-digit code</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            placeholder="123456"
          />
          <Button type="submit" size="lg" className="w-full" disabled={verifyPending}>
            {verifyPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            Verify and continue
          </Button>
          {verifyState.error && (
            <p role="alert" className="text-sm text-destructive">
              {verifyState.error}
            </p>
          )}
        </form>
      )}

      <div className="rounded-md border bg-background p-4">
        <p className="text-sm font-medium">Jump straight into the seeded demo data</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Sample cases, quotes and messages are loaded so both surfaces can be reviewed.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={demoSignInAction}>
            <input type="hidden" name="role" value="patient" />
            <Button type="submit" variant="secondary" size="sm">
              Sign in as a demo patient
            </Button>
          </form>
          <form action={demoSignInAction}>
            <input type="hidden" name="role" value="admin" />
            <Button type="submit" variant="secondary" size="sm">
              Sign in as a case manager
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
