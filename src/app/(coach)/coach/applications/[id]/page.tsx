"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  Send,
  Loader2,
  User,
  Target,
  Dumbbell,
  Heart,
  Droplet,
  Coffee,
  Utensils,
  Apple,
  Pill,
  Sparkles,
  MessageSquare,
  ImageIcon,
  X,
  ZoomIn,
  FileText,
  ExternalLink,
  Download,
  Save,
  ClipboardList,
} from "lucide-react";
import type { BloodReportFile, BloodReportValues } from "@/types/onboarding";
import { createClient } from "@/lib/supabase/client";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  type ApplicationStatus,
  type ClientApplication,
  APPLICATION_STEPS,
} from "@/types/application";

interface SubscriptionPlan {
  id: string;
  name: string;
  price_amount: number;
  duration_days: number;
  is_active: boolean;
}

interface TrainingPlan {
  id: string;
  name: string;
  description: string | null;
  days_per_week: number;
  plan_type: string;
  goal: string | null;
  is_active: boolean;
}

interface NutritionPlan {
  id: string;
  name: string;
  description: string | null;
  target_calories: number | null;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fat_g: number | null;
  diet_type: string | null;
  meal_count: number;
  is_active: boolean;
}

interface ApplicationWithPlan extends ClientApplication {
  plan?: {
    id: string;
    name: string;
    price: number;
    duration_days: number;
  } | null;
  reviewer?: {
    id: string;
    users: {
      first_name: string;
      last_name: string;
    };
  } | null;
  training_plan_id?: string | null;
  nutrition_plan_id?: string | null;
}

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationWithPlan | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);

  // Form states
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("upi");

  // Blood values state
  const [bloodValues, setBloodValues] = useState<Partial<BloodReportValues>>({});
  const [isSavingBloodValues, setIsSavingBloodValues] = useState(false);
  const [bloodValuesMessage, setBloodValuesMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Transformation plans state
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [selectedTrainingPlanId, setSelectedTrainingPlanId] = useState<string>("");
  const [selectedNutritionPlanId, setSelectedNutritionPlanId] = useState<string>("");
  const [isSavingPlans, setIsSavingPlans] = useState(false);
  const [plansMessage, setPlansMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadApplication();
    loadPlans();
    loadBloodValues();
    loadTransformationPlans();
  }, [resolvedParams.id]);

  async function loadApplication() {
    try {
      const response = await fetch(`/api/applications/${resolvedParams.id}`);
      const data = await response.json();

      if (data.success) {
        setApplication(data.application);
        // Initialize selected plan IDs from application data
        if (data.application.training_plan_id) {
          setSelectedTrainingPlanId(data.application.training_plan_id);
        }
        if (data.application.nutrition_plan_id) {
          setSelectedNutritionPlanId(data.application.nutrition_plan_id);
        }
      } else {
        setError(data.error || "Failed to load application");
      }
    } catch (err) {
      console.error("Error loading application:", err);
      setError("Failed to load application");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadPlans() {
    const supabase = createClient();
    const { data } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price_amount", { ascending: true });

    setPlans((data as SubscriptionPlan[]) || []);
  }

  async function loadTransformationPlans() {
    try {
      const response = await fetch("/api/plans?type=all");
      const data = await response.json();

      if (data.success) {
        setTrainingPlans(data.trainingPlans || []);
        setNutritionPlans(data.nutritionPlans || []);
      }
    } catch (err) {
      console.error("Error loading transformation plans:", err);
    }
  }

  async function loadBloodValues() {
    try {
      const response = await fetch(`/api/applications/${resolvedParams.id}/blood-values`);
      const data = await response.json();
      if (data.success && data.blood_report_values) {
        // Remove metadata fields from the form values
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { enteredBy, enteredAt, ...values } = data.blood_report_values;
        setBloodValues(values);
      }
    } catch (err) {
      console.error("Error loading blood values:", err);
    }
  }

  async function handleSaveBloodValues() {
    setIsSavingBloodValues(true);
    setBloodValuesMessage(null);

    try {
      const response = await fetch(
        `/api/applications/${resolvedParams.id}/blood-values`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bloodValues),
        }
      );

      const data = await response.json();

      if (data.success) {
        setBloodValuesMessage({ type: 'success', text: 'Blood values saved successfully' });
        setTimeout(() => setBloodValuesMessage(null), 3000);
      } else {
        setBloodValuesMessage({ type: 'error', text: data.error || 'Failed to save blood values' });
      }
    } catch (err) {
      console.error("Error saving blood values:", err);
      setBloodValuesMessage({ type: 'error', text: 'Failed to save blood values' });
    } finally {
      setIsSavingBloodValues(false);
    }
  }

  const handleBloodValueChange = (field: keyof BloodReportValues, value: string) => {
    const numValue = value === "" ? undefined : parseFloat(value);
    setBloodValues(prev => ({
      ...prev,
      [field]: numValue,
    }));
  };

  async function handleSaveTransformationPlans() {
    setIsSavingPlans(true);
    setPlansMessage(null);

    try {
      const response = await fetch(
        `/api/applications/${resolvedParams.id}/plans`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            training_plan_id: selectedTrainingPlanId || null,
            nutrition_plan_id: selectedNutritionPlanId || null,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setPlansMessage({ type: 'success', text: 'Plans saved successfully' });
        // Update local application state
        setApplication(prev => prev ? {
          ...prev,
          training_plan_id: selectedTrainingPlanId || null,
          nutrition_plan_id: selectedNutritionPlanId || null,
        } : null);
        setTimeout(() => setPlansMessage(null), 3000);
      } else {
        setPlansMessage({ type: 'error', text: data.error || 'Failed to save plans' });
      }
    } catch (err) {
      console.error("Error saving plans:", err);
      setPlansMessage({ type: 'error', text: 'Failed to save plans' });
    } finally {
      setIsSavingPlans(false);
    }
  }

  async function handleApprove() {
    if (!selectedPlanId) {
      setError("Please select a plan");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/applications/${resolvedParams.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "approve",
            selected_plan_id: selectedPlanId,
            custom_amount: customAmount ? parseFloat(customAmount) : undefined,
            review_notes: reviewNotes || undefined,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setShowApproveModal(false);
        await loadApplication();
      } else {
        setError(data.error || "Failed to approve application");
      }
    } catch (err) {
      console.error("Error approving application:", err);
      setError("Failed to approve application");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleReject() {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/applications/${resolvedParams.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reject",
            rejection_reason: rejectionReason,
            review_notes: reviewNotes || undefined,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setShowRejectModal(false);
        await loadApplication();
      } else {
        setError(data.error || "Failed to reject application");
      }
    } catch (err) {
      console.error("Error rejecting application:", err);
      setError("Failed to reject application");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleConfirmPayment() {
    if (!paymentReference.trim()) {
      setError("Please provide a payment reference");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/applications/${resolvedParams.id}/payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_reference: paymentReference,
            payment_method: paymentMethod,
            custom_amount: customAmount ? parseFloat(customAmount) : undefined,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setShowPaymentModal(false);
        await loadApplication();
      } else {
        setError(data.error || "Failed to confirm payment");
      }
    } catch (err) {
      console.error("Error confirming payment:", err);
      setError("Failed to confirm payment");
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSendInvite() {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/applications/${resolvedParams.id}/invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (data.success) {
        await loadApplication();
      } else {
        setError(data.error || "Failed to send invite");
      }
    } catch (err) {
      console.error("Error sending invite:", err);
      setError("Failed to send invite");
    } finally {
      setIsProcessing(false);
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case "submitted":
        return <Clock className="w-5 h-5" />;
      case "approved":
        return <CheckCircle2 className="w-5 h-5" />;
      case "payment_received":
        return <CreditCard className="w-5 h-5" />;
      case "invited":
        return <Mail className="w-5 h-5" />;
      case "completed":
        return <CheckCircle2 className="w-5 h-5" />;
      case "rejected":
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getSectionIcon = (stepId: string) => {
    switch (stepId) {
      case "personal_info":
        return <User className="w-5 h-5" />;
      case "goals":
        return <Target className="w-5 h-5" />;
      case "training_background":
        return <Dumbbell className="w-5 h-5" />;
      case "medical_history":
        return <Heart className="w-5 h-5" />;
      case "blood_reports":
        return <Droplet className="w-5 h-5" />;
      case "lifestyle":
        return <Coffee className="w-5 h-5" />;
      case "diet":
        return <Utensils className="w-5 h-5" />;
      case "food_preferences":
        return <Apple className="w-5 h-5" />;
      case "supplements":
        return <Pill className="w-5 h-5" />;
      case "skin_hair":
        return <Sparkles className="w-5 h-5" />;
      case "expectations":
        return <MessageSquare className="w-5 h-5" />;
      default:
        return null;
    }
  };

  // Map assessment data keys to step IDs
  const stepKeyMap: Record<string, string> = {
    personalInfo: "personal_info",
    goals: "goals",
    trainingBackground: "training_background",
    medicalHistory: "medical_history",
    bloodReports: "blood_reports",
    lifestyle: "lifestyle",
    diet: "diet",
    foodPreferences: "food_preferences",
    supplements: "supplements",
    skinHair: "skin_hair",
    expectations: "expectations",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Application not found
        </h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Link
          href="/coach/applications"
          className="text-primary hover:underline"
        >
          Back to Applications
        </Link>
      </div>
    );
  }

  const personalInfo = (application.assessment_data?.personalInfo || {}) as {
    firstName?: string;
    lastName?: string;
  };
  const applicantName =
    personalInfo.firstName && personalInfo.lastName
      ? `${personalInfo.firstName} ${personalInfo.lastName}`
      : application.email.split("@")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/coach/applications"
            className="mt-1 p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {applicantName}
            </h1>
            <div className="flex items-center gap-4 mt-1 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {application.email}
              </div>
              {application.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {application.phone}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                  STATUS_COLORS[application.status]
                }`}
              >
                {getStatusIcon(application.status)}
                {STATUS_LABELS[application.status]}
              </span>
              {application.plan && (
                <span className="text-sm text-muted-foreground">
                  Plan: {application.plan.name} (
                  {formatCurrency(
                    application.custom_amount || application.plan.price
                  )}
                  )
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {application.status === "submitted" && (
            <>
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => setShowApproveModal(true)}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Approve
              </button>
            </>
          )}

          {application.status === "approved" && (
            <button
              onClick={() => {
                // Pre-fill payment reference from client's submission
                if (application.payment_reference) {
                  setPaymentReference(application.payment_reference);
                }
                setShowPaymentModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Confirm Payment
            </button>
          )}

          {application.status === "payment_received" && (
            <button
              onClick={handleSendInvite}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send Invite
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Timeline</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created:</span>
            <span className="text-foreground">
              {formatDate(application.created_at)}
            </span>
          </div>
          {application.submitted_at && (
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              <span className="text-muted-foreground">Submitted:</span>
              <span className="text-foreground">
                {formatDate(application.submitted_at)}
              </span>
            </div>
          )}
          {application.reviewed_at && (
            <div className="flex items-center gap-3 text-sm">
              {application.status === "rejected" ? (
                <XCircle className="w-4 h-4 text-red-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
              <span className="text-muted-foreground">
                {application.status === "rejected" ? "Rejected:" : "Approved:"}
              </span>
              <span className="text-foreground">
                {formatDate(application.reviewed_at)}
              </span>
              {application.reviewer?.users && (
                <span className="text-muted-foreground">
                  by {application.reviewer.users.first_name}{" "}
                  {application.reviewer.users.last_name}
                </span>
              )}
            </div>
          )}
          {application.payment_confirmed_at && (
            <div className="flex items-center gap-3 text-sm">
              <CreditCard className="w-4 h-4 text-green-500" />
              <span className="text-muted-foreground">Payment Confirmed:</span>
              <span className="text-foreground">
                {formatDate(application.payment_confirmed_at)}
              </span>
              {application.payment_reference && (
                <span className="text-muted-foreground">
                  (Ref: {application.payment_reference})
                </span>
              )}
            </div>
          )}
          {application.converted_at && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-purple-500" />
              <span className="text-muted-foreground">Invite Sent:</span>
              <span className="text-foreground">
                {formatDate(application.converted_at)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Reason */}
      {application.status === "rejected" && application.rejection_reason && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
            Rejection Reason
          </h2>
          <p className="text-red-700 dark:text-red-300">
            {application.rejection_reason}
          </p>
        </div>
      )}

      {/* Assessment Data */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Assessment Data
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {application.progress_percentage}% complete
          </p>
        </div>

        <div className="divide-y divide-border">
          {APPLICATION_STEPS.filter(
            (step) =>
              step.id !== "contact_info" &&
              step.id !== "consent" &&
              stepKeyMap[
                Object.keys(stepKeyMap).find(
                  (k) => stepKeyMap[k] === step.id
                ) || ""
              ]
          ).map((step) => {
            const dataKey = Object.keys(stepKeyMap).find(
              (k) => stepKeyMap[k] === step.id
            );
            const sectionData = dataKey
              ? (application.assessment_data as Record<string, unknown>)?.[
                  dataKey
                ]
              : null;
            const hasData = sectionData && Object.keys(sectionData as object).length > 0;

            return (
              <div key={step.id} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-muted">
                    {getSectionIcon(step.id)}
                  </div>
                  <h3 className="font-semibold text-foreground">{step.label}</h3>
                  {!hasData && (
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      Not completed
                    </span>
                  )}
                </div>

                {hasData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(sectionData as object).map(([key, value]) => {
                      // Skip internal/meta fields
                      if (key.startsWith("_") || key === "id") return null;

                      // Format the key for display
                      const label = key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())
                        .trim();

                      // Format the value
                      let displayValue: React.ReactNode;
                      if (value === null || value === undefined || value === "") {
                        displayValue = "—";
                      } else if (typeof value === "boolean") {
                        displayValue = value ? "Yes" : "No";
                      } else if (Array.isArray(value)) {
                        displayValue = value.length > 0 ? value.join(", ") : "—";
                      } else if (typeof value === "object") {
                        displayValue = JSON.stringify(value);
                      } else {
                        displayValue = String(value);
                      }

                      return (
                        <div key={key} className="space-y-1">
                          <p className="text-sm text-muted-foreground">{label}</p>
                          <p className="text-foreground">{displayValue}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    This section was not completed.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Consent Information */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Consent Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            {application.consent_data_processing ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-foreground">Data Processing Consent</span>
          </div>
          <div className="flex items-center gap-3">
            {application.consent_marketing ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="text-foreground">Marketing Communications</span>
          </div>
          <div className="flex items-center gap-3">
            {application.consent_medical_sharing ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-foreground">Medical Data Sharing</span>
          </div>
          <div className="flex items-center gap-3">
            {application.consent_terms ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="text-foreground">Terms & Conditions</span>
          </div>
        </div>
        {application.consent_timestamp && (
          <p className="text-sm text-muted-foreground mt-4">
            Consented on: {formatDate(application.consent_timestamp)}
          </p>
        )}
      </div>

      {/* Transformation Plans Section */}
      {application.status !== "rejected" && application.status !== "draft" && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Transformation Plans
            </h2>
            {plansMessage && (
              <span className={`text-sm ${
                plansMessage.type === 'success'
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {plansMessage.text}
              </span>
            )}
          </div>

          {application.status === "invited" || application.status === "completed" ? (
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground mb-2">
                Plans have been assigned to this client. To modify plans, go to the client profile.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Training Plan</p>
                  <p className="font-medium text-foreground">
                    {trainingPlans.find(p => p.id === application.training_plan_id)?.name || "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nutrition Plan</p>
                  <p className="font-medium text-foreground">
                    {nutritionPlans.find(p => p.id === application.nutrition_plan_id)?.name || "Not assigned"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Select the training and nutrition plans to assign to this client when the invite is sent.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Training Plan Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Training Plan
                  </label>
                  {trainingPlans.length > 0 ? (
                    <select
                      value={selectedTrainingPlanId}
                      onChange={(e) => setSelectedTrainingPlanId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select a training plan...</option>
                      {trainingPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} ({plan.days_per_week} days/week)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-4 rounded-lg bg-muted text-center">
                      <p className="text-sm text-muted-foreground">
                        No training plans available.
                      </p>
                      <Link
                        href="/coach/plans"
                        className="text-sm text-primary hover:underline mt-1 inline-block"
                      >
                        Create a training plan
                      </Link>
                    </div>
                  )}
                  {selectedTrainingPlanId && (
                    <div className="mt-2 p-3 rounded-lg bg-muted/50">
                      {(() => {
                        const plan = trainingPlans.find(p => p.id === selectedTrainingPlanId);
                        return plan ? (
                          <div className="text-sm">
                            <p className="font-medium text-foreground">{plan.name}</p>
                            {plan.description && (
                              <p className="text-muted-foreground mt-1">{plan.description}</p>
                            )}
                            <div className="flex gap-4 mt-2 text-muted-foreground">
                              <span>{plan.days_per_week} days/week</span>
                              <span>{plan.plan_type}</span>
                              {plan.goal && <span>{plan.goal}</span>}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>

                {/* Nutrition Plan Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nutrition Plan
                  </label>
                  {nutritionPlans.length > 0 ? (
                    <select
                      value={selectedNutritionPlanId}
                      onChange={(e) => setSelectedNutritionPlanId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select a nutrition plan...</option>
                      {nutritionPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} ({plan.target_calories ? `${plan.target_calories} cal` : `${plan.meal_count} meals`})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-4 rounded-lg bg-muted text-center">
                      <p className="text-sm text-muted-foreground">
                        No nutrition plans available.
                      </p>
                      <Link
                        href="/coach/plans"
                        className="text-sm text-primary hover:underline mt-1 inline-block"
                      >
                        Create a nutrition plan
                      </Link>
                    </div>
                  )}
                  {selectedNutritionPlanId && (
                    <div className="mt-2 p-3 rounded-lg bg-muted/50">
                      {(() => {
                        const plan = nutritionPlans.find(p => p.id === selectedNutritionPlanId);
                        return plan ? (
                          <div className="text-sm">
                            <p className="font-medium text-foreground">{plan.name}</p>
                            {plan.description && (
                              <p className="text-muted-foreground mt-1">{plan.description}</p>
                            )}
                            <div className="flex gap-4 mt-2 text-muted-foreground">
                              {plan.target_calories && <span>{plan.target_calories} cal</span>}
                              {plan.target_protein_g && <span>{plan.target_protein_g}g protein</span>}
                              <span>{plan.meal_count} meals/day</span>
                              {plan.diet_type && <span>{plan.diet_type}</span>}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSaveTransformationPlans}
                  disabled={isSavingPlans}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSavingPlans ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Plans
                    </>
                  )}
                </button>
              </div>

              {/* Warning if no plans selected before invite */}
              {application.status === "payment_received" && !selectedTrainingPlanId && !selectedNutritionPlanId && (
                <div className="mt-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>Note:</strong> No plans selected. The client will not have any training or nutrition plans assigned when invited.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Blood Reports Section */}
      {(() => {
        const bloodReports = (application.assessment_data as Record<string, unknown>)?.bloodReports as {
          hasRecentReports?: boolean;
          reportDate?: string;
          labName?: string;
          uploadedReports?: BloodReportFile[];
        } | undefined;
        const uploadedReports = bloodReports?.uploadedReports || [];
        const hasUploadedReports = uploadedReports.length > 0;

        return (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Droplet className="w-5 h-5" />
              Blood Reports
            </h2>

            {/* Report Info */}
            {bloodReports?.hasRecentReports && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Report Date</p>
                  <p className="text-foreground">{bloodReports.reportDate || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lab Name</p>
                  <p className="text-foreground">{bloodReports.labName || "—"}</p>
                </div>
              </div>
            )}

            {/* Uploaded PDFs */}
            {hasUploadedReports ? (
              <div className="mb-6">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  Uploaded Reports ({uploadedReports.length})
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {uploadedReports.map((report, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {report.filename}
                          </p>
                          {report.size && (
                            <p className="text-xs text-muted-foreground">
                              {(report.size / (1024 * 1024)).toFixed(1)} MB
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={report.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-background rounded-lg transition-colors"
                          title="View PDF"
                        >
                          <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </a>
                        <a
                          href={report.url}
                          download={report.filename}
                          className="p-2 hover:bg-background rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 mb-6 bg-muted/50 rounded-lg">
                <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No blood reports uploaded</p>
              </div>
            )}

            {/* Blood Values Entry Form - Only show if there are uploaded reports */}
            {hasUploadedReports && application.status !== "rejected" && (
              <>
                <div className="border-t border-border pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-semibold text-foreground">
                      Enter Blood Values
                    </h3>
                    {bloodValuesMessage && (
                      <span className={`text-sm ${
                        bloodValuesMessage.type === 'success'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {bloodValuesMessage.text}
                      </span>
                    )}
                  </div>

                  {/* CBC */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Complete Blood Count (CBC)</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Hemoglobin (g/dL)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={bloodValues.hemoglobin ?? ""}
                          onChange={(e) => handleBloodValueChange("hemoglobin", e.target.value)}
                          placeholder="12-16"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">RBC (million/μL)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={bloodValues.rbc ?? ""}
                          onChange={(e) => handleBloodValueChange("rbc", e.target.value)}
                          placeholder="4.5-5.5"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">WBC (thousand/μL)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={bloodValues.wbc ?? ""}
                          onChange={(e) => handleBloodValueChange("wbc", e.target.value)}
                          placeholder="4-11"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Platelets (K/μL)</label>
                        <input
                          type="number"
                          value={bloodValues.platelets ?? ""}
                          onChange={(e) => handleBloodValueChange("platelets", e.target.value)}
                          placeholder="150-400"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Thyroid */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Thyroid Panel</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">TSH (mIU/L)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={bloodValues.tsh ?? ""}
                          onChange={(e) => handleBloodValueChange("tsh", e.target.value)}
                          placeholder="0.4-4.0"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">T3 (ng/dL)</label>
                        <input
                          type="number"
                          step="1"
                          value={bloodValues.t3 ?? ""}
                          onChange={(e) => handleBloodValueChange("t3", e.target.value)}
                          placeholder="80-200"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">T4 (μg/dL)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={bloodValues.t4 ?? ""}
                          onChange={(e) => handleBloodValueChange("t4", e.target.value)}
                          placeholder="4.5-12"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lipid Profile */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Lipid Profile</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Total Cholesterol</label>
                        <input
                          type="number"
                          value={bloodValues.totalCholesterol ?? ""}
                          onChange={(e) => handleBloodValueChange("totalCholesterol", e.target.value)}
                          placeholder="<200"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">LDL (mg/dL)</label>
                        <input
                          type="number"
                          value={bloodValues.ldl ?? ""}
                          onChange={(e) => handleBloodValueChange("ldl", e.target.value)}
                          placeholder="<100"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">HDL (mg/dL)</label>
                        <input
                          type="number"
                          value={bloodValues.hdl ?? ""}
                          onChange={(e) => handleBloodValueChange("hdl", e.target.value)}
                          placeholder=">40"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Triglycerides</label>
                        <input
                          type="number"
                          value={bloodValues.triglycerides ?? ""}
                          onChange={(e) => handleBloodValueChange("triglycerides", e.target.value)}
                          placeholder="<150"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Blood Sugar */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Blood Sugar</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Fasting Glucose (mg/dL)</label>
                        <input
                          type="number"
                          value={bloodValues.fastingGlucose ?? ""}
                          onChange={(e) => handleBloodValueChange("fastingGlucose", e.target.value)}
                          placeholder="70-100"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">HbA1c (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={bloodValues.hba1c ?? ""}
                          onChange={(e) => handleBloodValueChange("hba1c", e.target.value)}
                          placeholder="<5.7"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Vitamins & Minerals */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Vitamins & Minerals</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Vitamin D (ng/mL)</label>
                        <input
                          type="number"
                          value={bloodValues.vitaminD ?? ""}
                          onChange={(e) => handleBloodValueChange("vitaminD", e.target.value)}
                          placeholder="30-100"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Vitamin B12 (pg/mL)</label>
                        <input
                          type="number"
                          value={bloodValues.vitaminB12 ?? ""}
                          onChange={(e) => handleBloodValueChange("vitaminB12", e.target.value)}
                          placeholder="200-900"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Iron (μg/dL)</label>
                        <input
                          type="number"
                          value={bloodValues.iron ?? ""}
                          onChange={(e) => handleBloodValueChange("iron", e.target.value)}
                          placeholder="60-170"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Ferritin (ng/mL)</label>
                        <input
                          type="number"
                          value={bloodValues.ferritin ?? ""}
                          onChange={(e) => handleBloodValueChange("ferritin", e.target.value)}
                          placeholder="20-200"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Liver */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Liver Function</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">SGOT/AST (U/L)</label>
                        <input
                          type="number"
                          value={bloodValues.sgot ?? ""}
                          onChange={(e) => handleBloodValueChange("sgot", e.target.value)}
                          placeholder="10-40"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">SGPT/ALT (U/L)</label>
                        <input
                          type="number"
                          value={bloodValues.sgpt ?? ""}
                          onChange={(e) => handleBloodValueChange("sgpt", e.target.value)}
                          placeholder="7-56"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Kidney */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Kidney Function</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Creatinine (mg/dL)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={bloodValues.creatinine ?? ""}
                          onChange={(e) => handleBloodValueChange("creatinine", e.target.value)}
                          placeholder="0.7-1.3"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Uric Acid (mg/dL)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={bloodValues.uricAcid ?? ""}
                          onChange={(e) => handleBloodValueChange("uricAcid", e.target.value)}
                          placeholder="2.5-7"
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleSaveBloodValues}
                      disabled={isSavingBloodValues}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isSavingBloodValues ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Blood Values
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* Payment Proof Section */}
      {(application.payment_screenshot_url || application.payment_reference) && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Proof
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Screenshot */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Payment Screenshot
              </p>
              {application.payment_screenshot_url ? (
                <div
                  className="relative w-full h-48 bg-muted rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => setShowScreenshotModal(true)}
                >
                  <Image
                    src={application.payment_screenshot_url}
                    alt="Payment screenshot"
                    fill
                    className="object-contain"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No screenshot uploaded</p>
                  </div>
                </div>
              )}
            </div>

            {/* Reference ID */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Payment Reference ID
              </p>
              {application.payment_reference ? (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-mono text-lg text-foreground">
                    {application.payment_reference}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Submitted by applicant
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">No reference ID provided</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Lightbox Modal */}
      {showScreenshotModal && application.payment_screenshot_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setShowScreenshotModal(false)}
        >
          <button
            onClick={() => setShowScreenshotModal(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="relative w-full max-w-3xl h-[80vh] mx-4">
            <Image
              src={application.payment_screenshot_url}
              alt="Payment screenshot"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Approve Application
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Select Plan *
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => {
                    setSelectedPlanId(e.target.value);
                    const plan = plans.find((p) => p.id === e.target.value);
                    if (plan) {
                      setCustomAmount((plan.price_amount / 100).toString());
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a plan...</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {formatCurrency(plan.price_amount / 100)} (
                      {plan.duration_days} days)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Custom Amount (Optional)
                </label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Leave empty to use plan price"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Review Notes (Optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any notes about this application..."
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing || !selectedPlanId}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Approve"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Reject Application
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why this application is being rejected..."
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Review Notes (Optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={2}
                  placeholder="Internal notes (not shown to applicant)..."
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Reject"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Confirm Payment
            </h3>

            {application.plan && (
              <div className="mb-4 p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">
                  Expected Payment
                </p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(
                    application.custom_amount || application.plan.price
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {application.plan.name} ({application.plan.duration_days}{" "}
                  days)
                </p>
              </div>
            )}

            {/* Payment Proof from Client */}
            {(application.payment_screenshot_url || application.payment_reference) && (
              <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                  Payment proof submitted by applicant
                </p>
                <div className="flex gap-4">
                  {application.payment_screenshot_url && (
                    <div
                      className="relative w-20 h-20 bg-white rounded-lg overflow-hidden cursor-pointer flex-shrink-0"
                      onClick={() => {
                        setShowPaymentModal(false);
                        setShowScreenshotModal(true);
                      }}
                    >
                      <Image
                        src={application.payment_screenshot_url}
                        alt="Payment screenshot"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  {application.payment_reference && (
                    <div className="flex-1">
                      <p className="text-xs text-green-600 dark:text-green-400">Reference ID:</p>
                      <p className="font-mono text-sm text-green-800 dark:text-green-200">
                        {application.payment_reference}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Payment Reference {application.payment_reference ? "(Pre-filled)" : "*"}
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g., UPI transaction ID"
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {application.payment_reference && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-filled from client&apos;s submission. You can edit if needed.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isProcessing || !paymentReference.trim()}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Payment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
