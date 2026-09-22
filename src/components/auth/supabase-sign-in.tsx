"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { siteUrl } from "@/lib/supabase/config";
import { GoogleMark, OrDivider } from "./shared";

/** Google + phone OTP against a configured Supabase project. */
export function SupabaseSignIn({ next }: { next: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"google" | "phone" | null>(null);

  async function signInWithGoogle() {
    setError(null);
    setPending("google");
    const supabase = createSupabaseBrowserClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (oauthError) {
      setError(oauthError.message);
      setPending(null);
    }
  }

  async function sendCode(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending("phone");
    const supabase = createSupabaseBrowserClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone });
    setPending(null);
    if (otpError) setError(otpError.message);
    else setStep("code");
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending("phone");
    const supabase = createSupabaseBrowserClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: "sms",
    });
    setPending(null);
    if (verifyError) setError(verifyError.message);
    else router.push(`/post-sign-in?next=${encodeURIComponent(next)}`);
  }

  return (
    <div className="space-y-6">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={signInWithGoogle}
        disabled={pending !== null}
      >
        {pending === "google" ? <Loader2 className="size-4 animate-spin" /> : <GoogleMark />}
        Continue with Google
      </Button>

      <OrDivider />

      {step === "phone" ? (
        <form onSubmit={sendCode} className="space-y-3">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder="+234 802 000 0000"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Include your country code. We send a 6-digit code by SMS.
          </p>
          <Button type="submit" size="lg" className="w-full" disabled={pending !== null}>
            {pending === "phone" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Phone className="size-4" />
            )}
            Send me a code
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-3">
          <Label htmlFor="code">Enter the code sent to {phone}</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            placeholder="123456"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <Button type="submit" size="lg" className="w-full" disabled={pending !== null}>
            {pending === "phone" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            Verify and continue
          </Button>
          <button
            type="button"
            className="text-sm text-primary underline"
            onClick={() => setStep("phone")}
          >
            Use a different number
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
