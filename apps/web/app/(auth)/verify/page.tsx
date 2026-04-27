"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validateUsername } from "@/lib/auth/username";

const EMAIL_OTP_LENGTH = 8;

function mapVerifyError(message: string) {
  const lowered = message.toLowerCase();

  if (lowered.includes("expired") || lowered.includes("otp_expired")) {
    return "That code has expired. Request a new one and try again.";
  }

  if (lowered.includes("invalid") || lowered.includes("token") || lowered.includes("otp")) {
    return "That code is invalid. Double-check it and try again.";
  }

  if (lowered.includes("rate limit") || lowered.includes("too many")) {
    return "Too many attempts. Wait a few minutes before trying again.";
  }

  if (lowered.includes("already") && lowered.includes("confirm")) {
    return "This email is already confirmed. Sign in with your email and password.";
  }

  return message;
}

function mapResendError(message: string) {
  const lowered = message.toLowerCase();

  if (lowered.includes("rate limit") || lowered.includes("too many")) {
    return "A code was sent recently. Wait a minute before requesting another one.";
  }

  if (lowered.includes("already") && lowered.includes("confirm")) {
    return "This email is already confirmed. Sign in with your email and password.";
  }

  return message;
}

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const authCode = searchParams.get("code");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const digits = token.padEnd(EMAIL_OTP_LENGTH).slice(0, EMAIL_OTP_LENGTH).split("");

  useEffect(() => {
    if (!authCode) {
      return;
    }

    router.replace(`/callback?code=${encodeURIComponent(authCode)}&next=/`);
  }, [authCode, router]);

  async function finalizeProfile(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    metadataUsername: unknown
  ) {
    if (typeof metadataUsername !== "string") {
      return;
    }

    const username = metadataUsername.trim();
    const validationError = validateUsername(username);

    if (validationError) {
      return;
    }
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ username, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (profileError) {
      throw new Error(profileError.message);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);

    const normalizedEmail = email.trim();
    const normalizedToken = token.replace(/\D/g, "").slice(0, EMAIL_OTP_LENGTH);

    if (!normalizedEmail) {
      setError("Enter the email address you used to sign up.");
      return;
    }

    if (normalizedToken.length !== EMAIL_OTP_LENGTH) {
      setError(`Enter the ${EMAIL_OTP_LENGTH}-digit code from your email.`);
      return;
    }

    setVerifying(true);

    const supabase = createClient();
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: normalizedToken,
      type: "email",
    });

    if (verifyError) {
      setError(mapVerifyError(verifyError.message));
      setVerifying(false);
      return;
    }

    try {
      if (data.user) {
        await finalizeProfile(
          supabase,
          data.user.id,
          data.user.user_metadata?.username
        );
      }
      router.push("/");
      router.refresh();
    } catch (profileError) {
      const message =
        profileError instanceof Error
          ? profileError.message
          : "Your code was accepted, but we could not finish setting up your profile.";
      setError(message);
      setVerifying(false);
      return;
    }
  }

  async function handleResend() {
    setError(null);
    setStatus(null);

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Enter your email first so we know where to resend the code.");
      return;
    }

    setResending(true);

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/verify?email=${encodeURIComponent(normalizedEmail)}`,
      },
    });

    if (resendError) {
      setError(mapResendError(resendError.message));
      setResending(false);
      return;
    }

    setStatus(`A fresh code was sent to ${normalizedEmail}.`);
    setResending(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Verify your email
        </h1>
        <p
          className="text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Enter the {EMAIL_OTP_LENGTH}-digit code from your inbox to finish creating your account.
        </p>
        <p
          className="text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          If your email still shows a confirmation link, the link will continue working here while the email template is being updated.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="verify-email"
            className="text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            Email
          </label>
          <input
            id="verify-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all placeholder:opacity-40 focus:ring-2 focus:ring-(--color-accent)/30"
            style={{
              background: "var(--color-input-bg)",
              border: "1px solid var(--color-input-border)",
              color: "var(--color-text-primary)",
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="verify-code"
            className="text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            Verification code
          </label>

          <button
            type="button"
            onClick={() => inputRef.current?.focus()}
            className="grid grid-cols-8 gap-2 rounded-2xl p-3 text-left"
            style={{
              background: "var(--color-sidebar-bg)",
              border: "1px solid var(--color-border)",
            }}
          >
            {digits.map((digit, index) => {
              const isActive = index === Math.min(token.length, EMAIL_OTP_LENGTH - 1);

              return (
                <span
                  key={index}
                  className="flex h-12 items-center justify-center rounded-xl text-lg font-semibold"
                  style={{
                    background: "var(--color-bg)",
                    border: `1px solid ${
                      isActive ? "var(--color-accent)" : "var(--color-input-border)"
                    }`,
                    color: digit ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {digit || "•"}
                </span>
              );
            })}
          </button>

          <input
            ref={inputRef}
            id="verify-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            placeholder="12345678"
            value={token}
            onChange={(e) =>
              setToken(e.target.value.replace(/\D/g, "").slice(0, EMAIL_OTP_LENGTH))
            }
            maxLength={EMAIL_OTP_LENGTH}
            className="w-full rounded-lg px-3.5 py-2.5 text-center text-base outline-none transition-all placeholder:opacity-40 focus:ring-2 focus:ring-(--color-accent)/30"
            style={{
              background: "var(--color-input-bg)",
              border: "1px solid var(--color-input-border)",
              color: "var(--color-text-primary)",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.35em",
            }}
          />

          <p
            className="text-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Codes expire quickly. Request a new one if this code no longer works.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}

        {status && (
          <p
            className="text-sm"
            aria-live="polite"
            style={{ color: "var(--color-accent)" }}
          >
            {status}
          </p>
        )}

        <button
          type="submit"
          disabled={verifying}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
          style={{
            background: "var(--color-btn-primary-bg)",
            color: "var(--color-btn-primary-fg)",
          }}
        >
          {verifying ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Verifying…
            </>
          ) : (
            "Verify and continue"
          )}
        </button>
      </form>

      <div className="flex items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="font-medium transition-opacity hover:opacity-80 disabled:pointer-events-none disabled:opacity-50"
          style={{ color: "var(--color-accent)" }}
        >
          {resending ? "Sending another code…" : "Resend code"}
        </button>

        <Link
          href="/login"
          className="transition-opacity hover:opacity-80"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyPageContent />
    </Suspense>
  );
}