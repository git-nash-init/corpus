"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { supabaseBrowser } from "@/lib/supabase/client";
import { FormMessage, friendlyAuthError } from "./AuthShell";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Tell us what to call you.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Enter a valid email address.";
    if (password.length < 8) e.password = "Use at least 8 characters.";
    if (confirm !== password) e.confirm = "The passwords do not match.";
    if (!agree) e.agree = "Please accept the terms and privacy policy to continue.";
    setErr(e);
    setFormError(null);
    if (Object.keys(e).length) return;
    setBusy(true);
    const { data, error } = await supabaseBrowser().auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name.trim() }, emailRedirectTo: `${location.origin}/auth/confirm?next=/app` },
    });
    setBusy(false);
    if (error) {
      setFormError(friendlyAuthError(error.message));
      return;
    }
    // With email confirmation on there is no session yet. With it off, the user is signed in already.
    if (data.session) {
      router.replace("/app");
      router.refresh();
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4" role="status">
        <h2 className="font-display text-[28px]">Check your email</h2>
        <p className="text-ink-2">
          We sent a confirmation link to <span className="text-ink">{email.trim()}</span>. Open it to finish creating your account, then log in.
        </p>
        <p className="text-sm text-ink-3">It can take a minute. Check your spam folder if it does not arrive.</p>
        <Link href="/login" className="btn btn-primary w-full">
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      noValidate
      onSubmit={(ev) => {
        ev.preventDefault();
        void submit();
      }}
    >
      <TextField label="Your name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={err.name} />
      <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={err.email} />
      <TextField label="Password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={err.password} hint="At least 8 characters." />
      <TextField label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={err.confirm} />
      <div>
        <label className="flex cursor-pointer items-start gap-3 text-[14px] leading-snug text-ink-2">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-[3px] h-5 w-5 shrink-0 accent-[var(--brass)]" />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-brass underline underline-offset-4" target="_blank">
              terms of service
            </Link>{" "}
            and the{" "}
            <Link href="/privacy" className="text-brass underline underline-offset-4" target="_blank">
              privacy policy
            </Link>
            .
          </span>
        </label>
        {err.agree ? (
          <p className="error mt-2 text-[13px]" role="alert" style={{ color: "var(--loss)" }}>
            {err.agree}
          </p>
        ) : null}
      </div>
      {formError ? <FormMessage tone="error">{formError}</FormMessage> : null}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
        {busy ? "Creating your account" : "Create account"}
      </Button>
    </form>
  );
}
