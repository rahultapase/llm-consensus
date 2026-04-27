"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validateUsername } from "@/lib/auth/username";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const validationError = validateUsername(username.trim());

    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify?email=${encodeURIComponent(email)}`,
        data: {
          username: username.trim(),
        },
      },
    });

    if (error) {
      const msg =
        error.message.toLowerCase().includes("rate limit") ||
        error.message.toLowerCase().includes("too many")
          ? "Too many sign-up attempts. Please wait a few minutes before trying again, or continue with Google."
          : error.message;
      setError(msg);
      setLoading(false);
      return;
    }

    setLoading(false);

    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    router.push(`/verify?email=${encodeURIComponent(email)}`);
  }

  async function handleGoogleLogin() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });

    if (error) {
      setError(error.message);
    }
  }

  // Shared input style
  const inputStyle = {
    background: "var(--color-input-bg)",
    border: "1px solid var(--color-input-border)",
    color: "var(--color-text-primary)",
  } as const;

  const inputClassName =
    "w-full rounded-xl px-3.5 py-3 text-sm outline-none transition-all placeholder:opacity-40 focus:ring-2 focus:ring-(--color-accent)/20";

  return (
    <div className="auth-fade-in flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Create your account
        </h1>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Join the consensus. Start in seconds.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleEmailSignup} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="username"
            className="text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            placeholder="e.g. John"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setUsernameError(null);
            }}
            required
            autoComplete="username"
            minLength={2}
            maxLength={32}
            className={inputClassName}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-input-border)")}
          />
          {usernameError && (
            <p className="text-sm text-red-500" role="alert">{usernameError}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={inputClassName}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-input-border)")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className={`${inputClassName} pr-10`}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-input-border)")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 transition-opacity hover:opacity-70"
              style={{ color: "var(--color-text-secondary)" }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {password.length > 0 && password.length < 6 && (
            <p className="text-xs text-red-500">Password must be at least 6 characters.</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="confirm-password"
            className="text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className={`${inputClassName} pr-10`}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-input-border)")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 transition-opacity hover:opacity-70"
              style={{ color: "var(--color-text-secondary)" }}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500" role="alert">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:opacity-85 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
          style={{
            background: "var(--color-btn-primary-bg)",
            color: "var(--color-btn-primary-fg)",
          }}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div
          className="h-px flex-1"
          style={{ background: "var(--color-border)" }}
        />
        <span
          className="text-xs uppercase tracking-wider"
          style={{ color: "var(--color-text-secondary)" }}
        >
          or
        </span>
        <div
          className="h-px flex-1"
          style={{ background: "var(--color-border)" }}
        />
      </div>

      {/* Google OAuth button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.99]"
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-input-border)",
          color: "var(--color-text-primary)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--color-sidebar-hover)";
          e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--color-bg)";
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
        }}
      >
        <svg className="size-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      <p
        className="text-center text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium transition-opacity hover:opacity-80"
          style={{ color: "var(--color-accent)" }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
