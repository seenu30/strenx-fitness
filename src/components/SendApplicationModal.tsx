"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  User,
  Link2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Send,
  X,
  ArrowLeft,
  Loader2,
} from "lucide-react";

interface SendApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SendApplicationModal({
  isOpen,
  onClose,
}: SendApplicationModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [step, setStep] = useState<"form" | "options">("form");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // Generate the unique application URL
  const applicationUrl = typeof window !== "undefined" && applicationId
    ? `${window.location.origin}/apply?id=${applicationId}`
    : "";

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: "", email: "", message: "" });
      setStep("form");
      setIsGenerating(false);
      setEmailSent(false);
      setErrorMessage("");
      setCopied(false);
      setApplicationId(null);
    }
  }, [isOpen]);

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setErrorMessage("");

    try {
      // Create draft application via API
      const response = await fetch("/api/applications/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name || undefined,
          message: formData.message || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create invitation");
      }

      // Store the application ID for the unique URL
      setApplicationId(data.application.id);
      setStep("options");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to generate link");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(applicationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/share-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_email: formData.email,
          recipient_name: formData.name || undefined,
          custom_message: formData.message || undefined,
          application_id: applicationId, // Include the application ID for unique link
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setEmailSent(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const handleBack = () => {
    setStep("form");
    setEmailSent(false);
    setErrorMessage("");
    // Keep applicationId so we don't create duplicates
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-xl border border-border shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === "options" ? (
          /* Options Step */
          <div className="p-6">
            {/* Back button */}
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Link2 className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">
                Application Link Ready
              </h2>
              <p className="text-muted-foreground text-sm">
                Share this link with {formData.name || "your client"}
              </p>
            </div>

            {/* Copy Link Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Application Link
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2.5 bg-muted rounded-lg text-sm text-muted-foreground truncate border border-border">
                  {applicationUrl}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            {/* Send Email Section */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Send directly to: <span className="font-medium text-foreground">{formData.email}</span>
              </p>

              {/* Error Display */}
              {errorMessage && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-3">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {emailSent && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-3">
                  <div className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Email sent successfully!
                    </p>
                  </div>
                </div>
              )}

              {!emailSent && (
                <button
                  onClick={handleSendEmail}
                  disabled={isSending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Email
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        ) : (
          /* Form Step */
          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-1">
              Send Application Link
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Invite a potential client to fill out your coaching application
            </p>

            <form onSubmit={handleGenerateLink} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Name <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Personal Message <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={2}
                  maxLength={500}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Add a personal note..."
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {formData.message.length}/500
                </p>
              </div>

              {/* Error Display */}
              {errorMessage && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-3">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      Generate Link
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
