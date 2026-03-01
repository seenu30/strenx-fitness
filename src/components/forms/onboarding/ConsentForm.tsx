"use client";

import { useState } from "react";
import { Shield, FileText, Lock, AlertTriangle } from "lucide-react";

interface ConsentFormProps {
  onSubmit: () => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
}

const CONSENT_ITEMS = [
  {
    id: "data_processing",
    title: "Data Processing Consent",
    description:
      "I consent to the collection and processing of my personal data, including health and fitness information, for the purpose of creating personalized nutrition and training plans.",
    required: true,
  },
  {
    id: "medical_data_sharing",
    title: "Medical Data Sharing",
    description:
      "I consent to my coach viewing my medical history and blood report data to ensure safe and appropriate program design. This data is encrypted and accessible only to my assigned coach.",
    required: true,
  },
  {
    id: "photo_usage",
    title: "Progress Photo Usage",
    description:
      "I consent to uploading progress photos for tracking purposes. These photos are encrypted and will only be used to track my transformation progress.",
    required: true,
  },
  {
    id: "terms_of_service",
    title: "Terms of Service",
    description:
      "I have read and agree to the Terms of Service and Privacy Policy. I understand that this is a coaching service and not medical advice.",
    required: true,
  },
  {
    id: "marketing",
    title: "Marketing Communications",
    description:
      "I agree to receive occasional updates, tips, and promotional content via email. (You can unsubscribe at any time)",
    required: false,
  },
];

export default function ConsentForm({ onSubmit, onBack, isSubmitting }: ConsentFormProps) {
  const [consents, setConsents] = useState<Record<string, boolean>>({
    data_processing: false,
    medical_data_sharing: false,
    photo_usage: false,
    terms_of_service: false,
    marketing: false,
  });
  const [errors, setErrors] = useState<string[]>([]);

  const handleConsentChange = (id: string) => {
    setConsents((prev) => ({ ...prev, [id]: !prev[id] }));
    setErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required consents
    const missingConsents = CONSENT_ITEMS.filter(
      (item) => item.required && !consents[item.id]
    ).map((item) => item.title);

    if (missingConsents.length > 0) {
      setErrors(missingConsents);
      return;
    }

    await onSubmit();
  };

  const allRequiredChecked = CONSENT_ITEMS.filter((item) => item.required).every(
    (item) => consents[item.id]
  );

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6 text-green-600 dark:text-green-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Review & Consent
          </h2>
          <p className="text-muted-foreground mt-1">
            Please review and accept the following to complete your registration
          </p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">
              Your Data is Protected
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              We use industry-standard encryption (AES-256) to protect your sensitive
              health data. Your information is stored securely in compliance with India&apos;s
              Digital Personal Data Protection Act (DPDP) 2023.
            </p>
          </div>
        </div>
      </div>

      {/* Error display */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">
                Please accept the following required consents:
              </p>
              <ul className="text-sm text-red-700 dark:text-red-300 mt-1 list-disc list-inside">
                {errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Consent items */}
        <div className="space-y-4 mb-8">
          {CONSENT_ITEMS.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-lg border transition-colors ${
                consents[item.id]
                  ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                  : "bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700"
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consents[item.id]}
                  onChange={() => handleConsentChange(item.id)}
                  className="mt-1 w-5 h-5 rounded border-stone-300 text-green-600 focus:ring-green-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {item.title}
                    </span>
                    {item.required && (
                      <span className="text-xs text-red-500 font-medium">Required</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
              </label>
            </div>
          ))}
        </div>

        {/* Terms link */}
        <div className="mb-8 flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
          <FileText className="w-4 h-4" />
          <a href="#" className="text-brown-500 hover:text-brown-600 underline">
            Read full Terms of Service
          </a>
          <span>|</span>
          <a href="#" className="text-brown-500 hover:text-brown-600 underline">
            Privacy Policy
          </a>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-border">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-muted-foreground hover:text-stone-800 dark:hover:text-stone-200"
          >
            &larr; Back to form
          </button>

          <button
            type="submit"
            disabled={!allRequiredChecked || isSubmitting}
            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
              allRequiredChecked && !isSubmitting
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-stone-300 dark:bg-stone-700 text-stone-500 dark:text-stone-400 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
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
                Completing...
              </span>
            ) : (
              "Complete Registration"
            )}
          </button>
        </div>

        {/* Timestamp notice */}
        <p className="mt-4 text-center text-xs text-stone-400 dark:text-stone-500">
          By clicking &quot;Complete Registration&quot;, your consent will be recorded with a timestamp
          for compliance purposes.
        </p>
      </form>
    </div>
  );
}
