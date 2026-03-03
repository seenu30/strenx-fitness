"use client";

import { useState, useMemo, useRef } from "react";
import { Shield, FileText, Lock, AlertTriangle, PenTool, CheckCircle2, XCircle, QrCode, Copy, ImageIcon, X } from "lucide-react";
import Image from "next/image";

interface PaymentSettings {
  upiId: string;
  qrCodeUrl: string;
}

interface PaymentData {
  screenshot: File | null;
  referenceId: string;
}

interface ConsentFormProps {
  onSubmit: () => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
  expectedSignature?: string; // Expected full name: "FirstName LastName"
  paymentSettings?: PaymentSettings | null;
  paymentData?: PaymentData;
  onPaymentDataChange?: (data: PaymentData) => void;
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

export default function ConsentForm({
  onSubmit,
  onBack,
  isSubmitting,
  expectedSignature = "",
  paymentSettings,
  paymentData,
  onPaymentDataChange
}: ConsentFormProps) {
  const [consents, setConsents] = useState<Record<string, boolean>>({
    data_processing: false,
    medical_data_sharing: false,
    photo_usage: false,
    terms_of_service: false,
    marketing: false,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [digitalSignature, setDigitalSignature] = useState("");
  const [signatureTouched, setSignatureTouched] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize names for comparison (case-insensitive, trimmed, handle multiple spaces)
  const normalizeSignature = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' '); // Replace multiple spaces with single space
  };

  // Check if signature matches expected name
  const signatureMatches = useMemo(() => {
    if (!expectedSignature || !digitalSignature) return false;
    return normalizeSignature(digitalSignature) === normalizeSignature(expectedSignature);
  }, [digitalSignature, expectedSignature]);

  // Get signature validation status
  const getSignatureStatus = () => {
    if (!signatureTouched || !digitalSignature) return 'empty';
    if (signatureMatches) return 'valid';
    return 'invalid';
  };

  const signatureStatus = getSignatureStatus();

  const handleConsentChange = (id: string) => {
    setConsents((prev) => ({ ...prev, [id]: !prev[id] }));
    setErrors([]);
  };

  // Copy UPI ID to clipboard
  const handleCopyUpiId = async () => {
    if (paymentSettings?.upiId) {
      await navigator.clipboard.writeText(paymentSettings.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle screenshot file selection
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(['Please upload an image file (PNG, JPG, etc.)']);
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(['Screenshot must be less than 5MB']);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Update payment data
      if (onPaymentDataChange) {
        onPaymentDataChange({
          screenshot: file,
          referenceId: paymentData?.referenceId || ''
        });
      }
      setErrors([]);
    }
  };

  // Handle reference ID change
  const handleReferenceIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onPaymentDataChange) {
      onPaymentDataChange({
        screenshot: paymentData?.screenshot || null,
        referenceId: e.target.value
      });
    }
    setErrors([]);
  };

  // Remove screenshot
  const handleRemoveScreenshot = () => {
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onPaymentDataChange) {
      onPaymentDataChange({
        screenshot: null,
        referenceId: paymentData?.referenceId || ''
      });
    }
  };

  // Check if payment is valid (when payment settings exist)
  const isPaymentValid = !paymentSettings || (
    paymentData?.screenshot !== null &&
    paymentData?.referenceId?.trim() !== ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: string[] = [];

    // Validate payment (if settings exist)
    if (paymentSettings) {
      if (!paymentData?.screenshot) {
        newErrors.push("Payment screenshot is required");
      }
      if (!paymentData?.referenceId?.trim()) {
        newErrors.push("Payment reference ID is required");
      }
    }

    // Validate required consents
    const missingConsents = CONSENT_ITEMS.filter(
      (item) => item.required && !consents[item.id]
    ).map((item) => item.title);

    if (missingConsents.length > 0) {
      newErrors.push(...missingConsents.map(c => `Please accept: ${c}`));
    }

    // Validate digital signature
    if (!digitalSignature.trim()) {
      newErrors.push("Digital signature is required");
    } else if (!signatureMatches) {
      newErrors.push(`Signature must match your full name: "${expectedSignature}"`);
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      setSignatureTouched(true);
      return;
    }

    await onSubmit();
  };

  const allRequiredChecked = CONSENT_ITEMS.filter((item) => item.required).every(
    (item) => consents[item.id]
  );

  const canSubmit = allRequiredChecked && signatureMatches && isPaymentValid && !isSubmitting;

  // Get current date for display
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

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

      {/* Payment Section */}
      {paymentSettings && (
        <div className="mb-6 p-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <QrCode className="w-6 h-6 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Complete Payment
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                Scan the QR code or use UPI ID to make payment, then upload proof
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* QR Code and UPI ID */}
            <div className="space-y-4">
              {/* QR Code Display */}
              {paymentSettings.qrCodeUrl && (
                <div className="flex flex-col items-center">
                  <div className="relative w-48 h-48 bg-white rounded-lg p-2 shadow-sm">
                    <Image
                      src={paymentSettings.qrCodeUrl}
                      alt="Payment QR Code"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Scan with any UPI app
                  </p>
                </div>
              )}

              {/* UPI ID Display */}
              {paymentSettings.upiId && (
                <div className="flex items-center gap-2 p-3 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700">
                  <span className="text-sm text-muted-foreground">UPI ID:</span>
                  <span className="font-mono font-medium text-foreground flex-1">
                    {paymentSettings.upiId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpiId}
                    className={`p-2 rounded-md transition-colors ${
                      copied
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : 'hover:bg-stone-100 dark:hover:bg-stone-700 text-muted-foreground'
                    }`}
                    title={copied ? 'Copied!' : 'Copy UPI ID'}
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Screenshot Upload and Reference ID */}
            <div className="space-y-4">
              {/* Screenshot Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Payment Screenshot
                </label>
                <div className="relative">
                  {screenshotPreview ? (
                    <div className="relative w-full h-40 bg-stone-100 dark:bg-stone-800 rounded-lg overflow-hidden">
                      <Image
                        src={screenshotPreview}
                        alt="Payment screenshot"
                        fill
                        className="object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveScreenshot}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-stone-300 dark:border-stone-600 rounded-lg cursor-pointer hover:border-amber-400 dark:hover:border-amber-500 transition-colors bg-white dark:bg-stone-800">
                      <div className="flex flex-col items-center justify-center p-4">
                        <ImageIcon className="w-10 h-10 text-stone-400 mb-2" />
                        <p className="text-sm text-muted-foreground text-center">
                          <span className="font-medium text-amber-600 dark:text-amber-400">Click to upload</span>
                          <br />or drag and drop
                        </p>
                        <p className="text-xs text-stone-400 mt-1">PNG, JPG up to 5MB</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Reference ID Input */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Payment Reference ID
                </label>
                <input
                  type="text"
                  value={paymentData?.referenceId || ''}
                  onChange={handleReferenceIdChange}
                  placeholder="e.g., UPI transaction ID"
                  className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the transaction ID from your UPI app
                </p>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          {isPaymentValid && paymentSettings && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Payment proof uploaded successfully</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error display */}
      {errors.length > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">
                Please fix the following issues:
              </p>
              <ul className="text-sm text-red-700 dark:text-red-300 mt-1 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
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
                    {consents[item.id] && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
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

        {/* Digital Signature Section */}
        <div className="mb-8 p-6 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-brown-100 dark:bg-brown-900/30 flex items-center justify-center">
              <PenTool className="w-5 h-5 text-brown-600 dark:text-brown-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Digital Signature</h3>
              <p className="text-sm text-muted-foreground">
                Type your full name exactly as entered in your application
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={digitalSignature}
                onChange={(e) => {
                  setDigitalSignature(e.target.value);
                  setErrors([]);
                }}
                onBlur={() => setSignatureTouched(true)}
                placeholder={expectedSignature ? `Type "${expectedSignature}" to sign` : "Your full name"}
                className={`w-full px-4 py-3 pr-12 rounded-lg border-2 font-medium text-lg ${
                  signatureStatus === 'valid'
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : signatureStatus === 'invalid'
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900"
                } focus:outline-none focus:ring-2 focus:ring-primary italic`}
                style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {signatureStatus === 'valid' && (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                )}
                {signatureStatus === 'invalid' && (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
              </div>
            </div>

            {/* Signature hints */}
            {signatureTouched && signatureStatus === 'invalid' && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                Signature must exactly match: <strong>&quot;{expectedSignature}&quot;</strong>
              </p>
            )}

            {signatureStatus === 'valid' && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Signature verified successfully
              </p>
            )}

            {/* Signature preview */}
            {signatureStatus === 'valid' && (
              <div className="mt-4 p-4 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Digitally signed by:</p>
                    <p className="text-lg font-medium italic" style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}>
                      {digitalSignature}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Date:</p>
                    <p className="text-sm font-medium">{currentDate}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
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
            disabled={!canSubmit}
            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
              canSubmit
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
                Submitting...
              </span>
            ) : (
              "Complete Registration"
            )}
          </button>
        </div>

        {/* Validation summary */}
        {!canSubmit && (
          <div className="mt-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              <strong>To submit:</strong>
              {paymentSettings && !isPaymentValid && " Complete payment and upload proof."}
              {!allRequiredChecked && " Accept all required consents."}
              {!signatureMatches && ` Sign with your full name: "${expectedSignature}".`}
            </p>
          </div>
        )}

        {/* Timestamp notice */}
        <p className="mt-4 text-center text-xs text-stone-400 dark:text-stone-500">
          By clicking &quot;Complete Registration&quot;, your consent and digital signature
          will be recorded with a timestamp ({currentDate}) for compliance purposes.
        </p>
      </form>
    </div>
  );
}
