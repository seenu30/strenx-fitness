"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });

  // Real-time validation
  const passwordErrors = useMemo(() => {
    const errors: string[] = [];
    if (!password) errors.push("Password is required");
    else {
      if (password.length < 8) errors.push("At least 8 characters");
      if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
      if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
      if (!/[0-9]/.test(password)) errors.push("One number");
    }
    return errors;
  }, [password]);

  const confirmPasswordError = useMemo(() => {
    if (!confirmPassword) return "Confirm password is required";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  }, [password, confirmPassword]);

  const isFormValid = passwordErrors.length === 0 && !confirmPasswordError;

  useEffect(() => {
    // Check if user has a valid session from the invite link
    async function checkInvite() {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        setIsValidToken(true);
        setUserEmail(data.session.user.email || null);
      } else {
        // Check for token in URL (Supabase magic link)
        const token = searchParams.get("token");
        const type = searchParams.get("type");

        if (token && type === "invite") {
          // Verify the token
          const { data: verifyData, error: verifyError } =
            await supabase.auth.verifyOtp({
              token_hash: token,
              type: "invite",
            });

          if (verifyError) {
            setIsValidToken(false);
          } else if (verifyData.user) {
            setIsValidToken(true);
            setUserEmail(verifyData.user.email || null);
          }
        } else {
          setIsValidToken(false);
        }
      }
    }
    checkInvite();
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one lowercase letter.");
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Check if onboarding is already completed (for application-based clients)
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: client } = await supabase
          .from("clients")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .single() as { data: { onboarding_completed: boolean } | null };

        if (client?.onboarding_completed) {
          // Update client status to active
          await supabase
            .from("clients")
            .update({ status: "active" })
            .eq("user_id", user.id);

          // Check if there's an associated application to mark as completed
          const applicationId = user.user_metadata?.application_id;
          if (applicationId) {
            // Mark application as completed via API
            await fetch(`/api/applications/${applicationId}/complete`, {
              method: "POST",
            });
          }

          // Client came from application flow, skip onboarding
          router.push("/dashboard");
          return;
        }
      }

      // Redirect to onboarding (traditional invite flow)
      router.push("/onboarding");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Loading state
  if (isValidToken === null) {
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

  // Invalid or expired invite
  if (!isValidToken) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Invalid or Expired Invitation
        </h2>

        <p className="text-muted-foreground mb-6">
          This invitation link is invalid or has expired. Please contact your
          coach for a new invitation.
        </p>

        <a
          href="/login"
          className="inline-block py-2.5 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Go to Login
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Welcome to Strenx Fitness!
        </h2>

        {userEmail && (
          <p className="text-muted-foreground">
            Setting up account for{" "}
            <span className="font-medium text-foreground">
              {userEmail}
            </span>
          </p>
        )}
      </div>

      <p className="text-muted-foreground text-center mb-6">
        Please create a password to complete your account setup.
      </p>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Create Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
            required
            autoComplete="new-password"
            placeholder="Enter your password"
            className={`w-full px-4 py-2.5 rounded-lg border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
              touched.password && passwordErrors.length > 0 ? "border-red-500" : "border-border"
            }`}
          />
          {touched.password && passwordErrors.length > 0 && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordErrors[0]}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
            required
            autoComplete="new-password"
            placeholder="Confirm your password"
            className={`w-full px-4 py-2.5 rounded-lg border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
              touched.confirmPassword && confirmPasswordError ? "border-red-500" : "border-border"
            }`}
          />
          {touched.confirmPassword && confirmPasswordError && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{confirmPasswordError}</p>
          )}
        </div>

        {/* Password Requirements */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">
            Password must contain:
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            <li
              className={
                password.length >= 8 ? "text-green-600 dark:text-green-400" : ""
              }
            >
              At least 8 characters
            </li>
            <li
              className={
                /[A-Z]/.test(password)
                  ? "text-green-600 dark:text-green-400"
                  : ""
              }
            >
              One uppercase letter
            </li>
            <li
              className={
                /[a-z]/.test(password)
                  ? "text-green-600 dark:text-green-400"
                  : ""
              }
            >
              One lowercase letter
            </li>
            <li
              className={
                /[0-9]/.test(password)
                  ? "text-green-600 dark:text-green-400"
                  : ""
              }
            >
              One number
            </li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              Setting up...
            </span>
          ) : (
            "Complete Setup"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By creating an account, you agree to our Terms of Service and Privacy
        Policy.
      </p>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}
