"use client";

import { useState } from "react";
import { X, Copy, Check, Mail, Link as LinkIcon, Loader2 } from "lucide-react";

interface ShareApplicationLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = "copy" | "email";

export default function ShareApplicationLinkModal({
  isOpen,
  onClose,
}: ShareApplicationLinkModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("copy");
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const applicationUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/apply`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(applicationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy");
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setSendStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/share-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_email: email,
          recipient_name: name || undefined,
          custom_message: message || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setSendStatus("success");
      setEmail("");
      setName("");
      setMessage("");
    } catch (error) {
      setSendStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setActiveTab("copy");
    setCopied(false);
    setEmail("");
    setName("");
    setMessage("");
    setSendStatus("idle");
    setErrorMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Share Application Link</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("copy")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "copy"
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            Copy Link
          </button>
          <button
            onClick={() => setActiveTab("email")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "email"
                ? "text-primary border-b-2 border-primary bg-primary/5"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Mail className="w-4 h-4" />
            Send Email
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "copy" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Share this link with potential clients. They can fill out the application form at their own pace.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={applicationUrl}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-muted text-foreground text-sm"
                />
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                    copied
                      ? "bg-green-600 text-white"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Clients can save their progress and continue later.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendEmail} className="space-y-4">
              {sendStatus === "success" ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-foreground font-medium">Email sent successfully!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    The application link has been sent.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSendStatus("idle")}
                    className="mt-4 text-sm text-primary hover:text-primary/80"
                  >
                    Send another
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Name <span className="text-muted-foreground text-xs">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Personal Message <span className="text-muted-foreground text-xs">(optional)</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Hi! I'd love to help you on your fitness journey. Please fill out this application so we can get started..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.length}/500 characters
                    </p>
                  </div>

                  {sendStatus === "error" && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSending || !email}
                    className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Send Invitation
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
