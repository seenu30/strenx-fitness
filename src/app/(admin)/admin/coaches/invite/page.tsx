"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Loader2 } from "lucide-react";

export default function InviteCoachPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    specializations: "",
    experienceYears: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/invite-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          specializations: formData.specializations,
          experienceYears: formData.experienceYears,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to invite coach");
      }

      setSuccess(true);
    } catch (err) {
      console.error("Error inviting coach:", err);
      setError(err instanceof Error ? err.message : "Failed to invite coach. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Invitation Sent!
          </h2>
          <p className="text-muted-foreground mb-6">
            An invitation email has been sent to {formData.email}. They can use
            the link to set up their account.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/admin/coaches"
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              View Coaches
            </Link>
            <button
              onClick={() => {
                setSuccess(false);
                setFormData({
                  email: "",
                  firstName: "",
                  lastName: "",
                  specializations: "",
                  experienceYears: "",
                });
              }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Invite Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/coaches"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Coaches
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Invite New Coach</h1>
        <p className="text-muted-foreground mt-1">
          Send an invitation to a new coach to join the platform
        </p>
      </div>

      {/* Form */}
      <div className="bg-card rounded-xl border border-border p-6">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="coach@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Specializations
            </label>
            <input
              type="text"
              value={formData.specializations}
              onChange={(e) =>
                setFormData({ ...formData, specializations: e.target.value })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Weight Loss, Muscle Building, Nutrition"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Separate multiple specializations with commas
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Years of Experience
            </label>
            <input
              type="number"
              value={formData.experienceYears}
              onChange={(e) =>
                setFormData({ ...formData, experienceYears: e.target.value })
              }
              min="0"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="5"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending Invitation...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Send Invitation
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
