"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
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
    // Check if user has a valid session (came from reset email)
    async function checkSession() {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      setIsValidSession(!!data.session);
    }
    checkSession();
  }, []);

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

      // Redirect to login with success message
      router.push("/login?message=Password updated successfully. Please sign in.");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Loading state
  if (isValidSession === null) {
    return (
      <div className="flex items-center justify-center">
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

  // Invalid session
  if (!isValidSession) {
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
          Invalid or Expired Link
        </h2>

        <p className="text-muted-foreground mb-6">
          This password reset link is invalid or has expired. Please request a
          new one.
        </p>

        <a
          href="/forgot-password"
          className="inline-block py-2.5 px-6 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Request New Link
        </a>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-foreground text-center mb-2">
        Set New Password
      </h2>

      <p className="text-muted-foreground text-center mb-6">
        Please enter your new password below.
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
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
            required
            autoComplete="new-password"
            placeholder="Enter new password"
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
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
            required
            autoComplete="new-password"
            placeholder="Confirm new password"
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
            <li className={password.length >= 8 ? "text-green-600 dark:text-green-400" : ""}>
              At least 8 characters
            </li>
            <li className={/[A-Z]/.test(password) ? "text-green-600 dark:text-green-400" : ""}>
              One uppercase letter
            </li>
            <li className={/[a-z]/.test(password) ? "text-green-600 dark:text-green-400" : ""}>
              One lowercase letter
            </li>
            <li className={/[0-9]/.test(password) ? "text-green-600 dark:text-green-400" : ""}>
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
              Updating...
            </span>
          ) : (
            "Update Password"
          )}
        </button>
      </form>
    </div>
  );
}
