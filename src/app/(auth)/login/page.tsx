"use client";

import { useState, Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  const redirectTo = searchParams.get("next") || "/dashboard";

  // Real-time validation
  const emailError = useMemo(() => {
    if (!email) return "Email is required";
    if (!EMAIL_REGEX.test(email)) return "Invalid email format";
    return null;
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) return "Password is required";
    return null;
  }, [password]);

  // Form is valid when both fields have no errors
  const isFormValid = !emailError && !passwordError;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please try again.");
        } else if (signInError.message.includes("Email not confirmed")) {
          setError("Please verify your email address before signing in.");
        } else {
          setError(signInError.message);
        }
        return;
      }

      // Get user role to determine redirect destination
      let finalRedirect = redirectTo;
      if (authData.user) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', authData.user.id)
          .single() as { data: { role: string } | null };

        const role = userProfile?.role || 'client';

        // Override default redirect based on role (unless specific next URL provided)
        if (!searchParams.get("next")) {
          if (role === 'super_admin') {
            finalRedirect = '/super-admin'; // Super Admin dashboard
          } else if (role === 'coach') {
            finalRedirect = '/admin'; // Coach dashboard
          } else {
            finalRedirect = '/dashboard'; // Client dashboard
          }
        }
      }

      router.push(finalRedirect);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-foreground text-center mb-6">
        Welcome Back
      </h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {searchParams.get("message") && (
        <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm">
          {searchParams.get("message")}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={`w-full px-4 py-2.5 rounded-lg border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors ${
              touched.email && emailError ? "border-destructive" : "border-input"
            }`}
          />
          {touched.email && emailError && (
            <p className="mt-1 text-sm text-destructive">{emailError}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:text-primary/80"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            className={`w-full px-4 py-2.5 rounded-lg border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors ${
              touched.password && passwordError ? "border-destructive" : "border-input"
            }`}
          />
          {touched.password && passwordError && (
            <p className="mt-1 text-sm text-destructive">{passwordError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="w-full py-2.5 px-4 rounded-lg bg-foreground text-background font-medium hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <span className="text-foreground">
          Contact your coach for an invitation.
        </span>
      </p>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-8">
      <svg
        className="animate-spin h-8 w-8 text-muted-foreground"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginForm />
    </Suspense>
  );
}
