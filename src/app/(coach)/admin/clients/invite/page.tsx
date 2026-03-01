"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Mail,
  User,
  Phone,
  Send,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function InviteClientPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    plan: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);

  const plans = [
    { id: "30-kickstart", name: "30 Day Kickstart", price: "₹9,999" },
    { id: "60-lean", name: "60 Day Lean", price: "₹17,999" },
    { id: "90-transform", name: "90 Day Transform", price: "₹24,999" },
    { id: "100-elite", name: "100 Day Elite", price: "₹29,999" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock success
    setSubmitStatus("success");
    setIsSubmitting(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (submitStatus === "success") {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">
            Invitation Sent!
          </h2>
          <p className="text-stone-600 dark:text-stone-400 mb-6">
            An invite email has been sent to{" "}
            <span className="font-medium">{formData.email}</span>. They will
            receive instructions to set up their account.
          </p>
          <div className="space-y-3">
            <Link
              href="/admin/clients"
              className="block w-full px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700"
            >
              View All Clients
            </Link>
            <button
              onClick={() => {
                setSubmitStatus(null);
                setFormData({
                  firstName: "",
                  lastName: "",
                  email: "",
                  phone: "",
                  plan: "",
                  notes: "",
                });
              }}
              className="block w-full px-4 py-2 border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 rounded-lg font-medium hover:bg-stone-50 dark:hover:bg-stone-800"
            >
              Invite Another Client
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
          href="/admin/clients"
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Clients
        </Link>
        <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
          Invite New Client
        </h1>
        <p className="text-stone-600 dark:text-stone-400 mt-1">
          Send an invitation email to onboard a new client
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <h2 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
            Client Information
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                First Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="John"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>
            <p className="text-xs text-stone-500 mt-1">
              The invitation link will be sent to this email address
            </p>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
          <h2 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
            Program Selection
          </h2>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Assign Plan *
            </label>
            <select
              name="plan"
              value={formData.plan}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="">Select a plan...</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {plan.price}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              placeholder="Add any notes about this client..."
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">What happens next?</p>
              <ul className="space-y-1 list-disc list-inside text-blue-600 dark:text-blue-400">
                <li>Client receives an email invitation with a secure link</li>
                <li>They create their password and complete the onboarding form</li>
                <li>You&apos;ll be notified once they complete onboarding</li>
                <li>Their assessment data will be available for review</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending Invitation...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send Invitation
            </>
          )}
        </button>
      </form>
    </div>
  );
}
