"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AssessmentData } from "@/types/onboarding";
import {
  APPLICATION_STEPS,
  type ApplicationFormState,
  type ContactInfo,
  type ConsentData,
  calculateProgress,
} from "@/types/application";

interface PaymentSettings {
  upiId: string;
  qrCodeUrl: string;
}

interface PaymentData {
  screenshot: File | null;
  referenceId: string;
}

// Form components - reuse from onboarding
import PersonalInfoForm from "@/components/forms/onboarding/PersonalInfoForm";
import GoalsForm from "@/components/forms/onboarding/GoalsForm";
import TrainingBackgroundForm from "@/components/forms/onboarding/TrainingBackgroundForm";
import MedicalHistoryForm from "@/components/forms/onboarding/MedicalHistoryForm";
import BloodReportsForm from "@/components/forms/onboarding/BloodReportsForm";
import LifestyleForm from "@/components/forms/onboarding/LifestyleForm";
import DietForm from "@/components/forms/onboarding/DietForm";
import FoodPreferencesForm from "@/components/forms/onboarding/FoodPreferencesForm";
import SupplementsForm from "@/components/forms/onboarding/SupplementsForm";
import SkinHairForm from "@/components/forms/onboarding/SkinHairForm";
import ExpectationsForm from "@/components/forms/onboarding/ExpectationsForm";
import ConsentForm, { type ConsentData as ConsentFormData } from "@/components/forms/onboarding/ConsentForm";

// Icons
import {
  User,
  Target,
  Dumbbell,
  Heart,
  FileText,
  Moon,
  UtensilsCrossed,
  Apple,
  Pill,
  Sparkles,
  MessageSquare,
  Check,
  ChevronLeft,
  ChevronRight,
  Shield,
  Mail,
  Phone,
  Loader2,
  Info,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Mail,
  User,
  Target,
  Dumbbell,
  Heart,
  FileText,
  Moon,
  UtensilsCrossed,
  Apple,
  Pill,
  Sparkles,
  MessageSquare,
  Shield,
};

const STEP_ICONS: Record<string, string> = {
  contact_info: "Mail",
  personal_info: "User",
  goals: "Target",
  training_background: "Dumbbell",
  medical_history: "Heart",
  blood_reports: "FileText",
  lifestyle: "Moon",
  diet: "UtensilsCrossed",
  food_preferences: "Apple",
  supplements: "Pill",
  skin_hair: "Sparkles",
  expectations: "MessageSquare",
  consent: "Shield",
};

const STORAGE_KEY = "strenx_application";

function ApplyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("id");
  const [state, setState] = useState<ApplicationFormState>({
    applicationId: null,
    contactInfo: { email: "", phone: "" },
    assessmentData: {},
    consent: {
      dataProcessing: false,
      marketing: false,
      medicalSharing: false,
      terms: false,
    },
    currentStep: "contact_info",
    completedSteps: [],
    isSubmitting: false,
    isSaving: false,
    error: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    screenshot: null,
    referenceId: '',
  });

  // Load saved progress from localStorage, fetch application if ID provided, and fetch payment settings
  useEffect(() => {
    const initialize = async () => {
      try {
        // If we have an application ID in URL, fetch that application
        if (applicationId) {
          const appResponse = await fetch(`/api/applications/${applicationId}`);
          if (appResponse.ok) {
            const appData = await appResponse.json();
            if (appData.success && appData.application) {
              const app = appData.application;
              // Pre-fill state from the fetched application
              // Strip +91 prefix from phone for display (we show it separately)
              const phoneWithoutPrefix = (app.phone || "").replace(/^\+91/, "");
              const completedSteps = app.completed_steps || [];

              // Determine current step based on completed steps
              // Find the first incomplete step, or the last step if all are complete
              let currentStep = "contact_info";
              for (const step of APPLICATION_STEPS) {
                if (!completedSteps.includes(step.id)) {
                  currentStep = step.id;
                  break;
                }
              }
              // If all steps are complete, go to the last step (consent/payment)
              if (completedSteps.length === APPLICATION_STEPS.length) {
                currentStep = APPLICATION_STEPS[APPLICATION_STEPS.length - 1].id;
              }

              setState((prev) => ({
                ...prev,
                applicationId: app.id,
                contactInfo: {
                  email: app.email || "",
                  phone: phoneWithoutPrefix,
                },
                assessmentData: app.assessment_data || {},
                completedSteps,
                currentStep,
                isSubmitting: false,
                isSaving: false,
                error: null,
              }));
              // Also save to localStorage so progress persists
              localStorage.setItem(STORAGE_KEY, JSON.stringify({
                applicationId: app.id,
                contactInfo: { email: app.email || "", phone: phoneWithoutPrefix },
                assessmentData: app.assessment_data || {},
                completedSteps,
                currentStep,
              }));
            }
          }
        } else {
          // Load saved progress from localStorage
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            setState((prev) => ({
              ...prev,
              ...parsed,
              isSubmitting: false,
              isSaving: false,
              error: null,
            }));
          }
        }

        // Fetch payment settings
        const response = await fetch('/api/payment-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.settings) {
            setPaymentSettings(data.settings);
          }
        }
      } catch (error) {
        console.error("Error initializing:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [applicationId]);

  // Save progress to localStorage
  const saveToLocalStorage = useCallback((newState: ApplicationFormState) => {
    try {
      const toSave = {
        applicationId: newState.applicationId,
        contactInfo: newState.contactInfo,
        assessmentData: newState.assessmentData,
        consent: newState.consent,
        currentStep: newState.currentStep,
        completedSteps: newState.completedSteps,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, []);

  // Get current step index
  const currentStepIndex = APPLICATION_STEPS.findIndex(
    (s) => s.id === state.currentStep
  );

  // Handle step navigation
  const goToStep = useCallback(
    (stepId: string) => {
      setState((prev) => {
        const newState = { ...prev, currentStep: stepId };
        saveToLocalStorage(newState);
        return newState;
      });
    },
    [saveToLocalStorage]
  );

  const goToNextStep = useCallback(() => {
    if (currentStepIndex < APPLICATION_STEPS.length - 1) {
      goToStep(APPLICATION_STEPS[currentStepIndex + 1].id);
    }
  }, [currentStepIndex, goToStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      goToStep(APPLICATION_STEPS[currentStepIndex - 1].id);
    }
  }, [currentStepIndex, goToStep]);

  // Handle form data save
  const handleSaveStep = useCallback(
    async (stepId: string, data: unknown) => {
      // Use a ref to capture the new state for database save
      let newStateForDb: typeof state | null = null;

      setState((prev) => {
        // Normalize camelCase stepId to snake_case for APPLICATION_STEPS compatibility
        const stepIdNormalizeMap: Record<string, string> = {
          personalInfo: "personal_info",
          trainingBackground: "training_background",
          medicalHistory: "medical_history",
          bloodReports: "blood_reports",
          foodPreferences: "food_preferences",
          skinHair: "skin_hair",
        };
        const normalizedStepId = stepIdNormalizeMap[stepId] || stepId;

        const completedSteps = prev.completedSteps.includes(normalizedStepId)
          ? prev.completedSteps
          : [...prev.completedSteps, normalizedStepId];

        const newState = { ...prev, completedSteps };

        // Map step data to appropriate field
        if (stepId === "contact_info") {
          newState.contactInfo = data as ContactInfo;
        } else if (stepId === "consent") {
          newState.consent = data as ConsentData;
        } else {
          // Map to assessment data
          // Support both snake_case (from step navigation) and camelCase (from form onSave)
          const keyMap: Record<string, keyof AssessmentData> = {
            // snake_case keys (from APPLICATION_STEPS)
            personal_info: "personalInfo",
            training_background: "trainingBackground",
            medical_history: "medicalHistory",
            blood_reports: "bloodReports",
            food_preferences: "foodPreferences",
            skin_hair: "skinHair",
            // camelCase keys (from form onSave callbacks)
            personalInfo: "personalInfo",
            trainingBackground: "trainingBackground",
            medicalHistory: "medicalHistory",
            bloodReports: "bloodReports",
            foodPreferences: "foodPreferences",
            skinHair: "skinHair",
            // Keys that are the same in both formats
            goals: "goals",
            lifestyle: "lifestyle",
            diet: "diet",
            supplements: "supplements",
            expectations: "expectations",
          };
          const key = keyMap[stepId];
          if (key) {
            newState.assessmentData = {
              ...prev.assessmentData,
              [key]: data,
            };
          }
        }

        saveToLocalStorage(newState);
        newStateForDb = newState;
        return newState;
      });

      // If we have an applicationId (draft from invitation), save progress to database
      // Use setTimeout to ensure setState has completed
      setTimeout(async () => {
        if (newStateForDb?.applicationId) {
          try {
            await fetch(`/api/applications/${newStateForDb.applicationId}/progress`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                assessment_data: newStateForDb.assessmentData,
                completed_steps: newStateForDb.completedSteps,
                progress_percentage: calculateProgress(newStateForDb.completedSteps),
                phone: newStateForDb.contactInfo.phone ? `+91${newStateForDb.contactInfo.phone}` : null,
              }),
            });
          } catch (error) {
            console.error("Error saving progress to database:", error);
          }
        }
      }, 0);
    },
    [saveToLocalStorage, calculateProgress]
  );

  // Handle form submission
  const handleSubmit = async (consentData: ConsentFormData) => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      let paymentScreenshotUrl = null;
      let paymentScreenshotPath = null;

      // Upload payment screenshot if exists
      if (paymentData.screenshot && paymentSettings) {
        const formData = new FormData();
        formData.append('file', paymentData.screenshot);

        const uploadResponse = await fetch('/api/upload/payment-screenshot', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          throw new Error(uploadError.error || 'Failed to upload payment screenshot');
        }

        const uploadResult = await uploadResponse.json();
        paymentScreenshotUrl = uploadResult.url;
        paymentScreenshotPath = uploadResult.path;
      }

      // Create or update application via API
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: state.applicationId || undefined, // Include if updating existing draft
          email: state.contactInfo.email,
          phone: state.contactInfo.phone ? `+91${state.contactInfo.phone}` : null,
          assessment_data: state.assessmentData,
          completed_steps: state.completedSteps,
          progress_percentage: calculateProgress(state.completedSteps),
          consent_data_processing: consentData.dataProcessing,
          consent_marketing: consentData.marketing,
          consent_medical_sharing: consentData.medicalSharing,
          consent_terms: consentData.terms,
          digital_signature: consentData.digitalSignature,
          signature_timestamp: consentData.signatureTimestamp,
          payment_reference: paymentData.referenceId || null,
          payment_screenshot_url: paymentScreenshotUrl,
          payment_screenshot_path: paymentScreenshotPath,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit application");
      }

      // Clear localStorage and redirect
      localStorage.removeItem(STORAGE_KEY);
      router.push("/apply/thank-you");
    } catch (error) {
      console.error("Error submitting application:", error);
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: error instanceof Error ? error.message : "Submission failed",
      }));
    }
  };

  // Validation helpers for contact form
  const validateContactEmail = (email: string): string | null => {
    if (!email?.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address";
    return null;
  };

  const validateContactPhone = (phone: string): string | null => {
    if (!phone?.trim()) return "Phone number is required";
    // Remove any non-digit characters for validation
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) return "Enter a valid 10-digit mobile number";
    if (!/^[6-9]/.test(cleaned)) return "Indian mobile numbers start with 6, 7, 8, or 9";
    return null;
  };

  // Get validation status for contact fields
  const getContactFieldStatus = (field: 'email' | 'phone') => {
    const value = field === 'email' ? state.contactInfo.email : state.contactInfo.phone;
    if (!value?.trim()) return null;

    const error = field === 'email'
      ? validateContactEmail(value)
      : validateContactPhone(value || '');

    if (error) return 'invalid';
    return 'valid';
  };

  // Render contact info form
  const renderContactInfoForm = () => {
    const emailStatus = getContactFieldStatus('email');
    const phoneStatus = getContactFieldStatus('phone');

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Let&apos;s Get Started
          </h2>
          <p className="text-muted-foreground">
            Enter your contact information to begin your application.
          </p>
        </div>

        {/* Info banner */}
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            Your contact information is kept confidential and only used to communicate with you about your fitness journey.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                id="email"
                value={state.contactInfo.email}
                onChange={(e) => {
                  setState((prev) => ({
                    ...prev,
                    contactInfo: { ...prev.contactInfo, email: e.target.value },
                    error: null,
                  }));
                }}
                className={`w-full pl-10 pr-10 py-3 rounded-lg border ${
                  emailStatus === 'valid'
                    ? "border-green-500 focus:ring-green-500"
                    : emailStatus === 'invalid'
                    ? "border-red-500 focus:ring-red-500"
                    : "border-border"
                } bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
                placeholder="you@example.com"
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {emailStatus === 'valid' && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
                {emailStatus === 'invalid' && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
            {emailStatus === 'invalid' && (
              <p className="mt-1 text-sm text-red-500">
                {validateContactEmail(state.contactInfo.email)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Info className="w-3 h-3" />
              We&apos;ll send your login credentials to this email
            </p>
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Phone Number
            </label>
            <div className="relative flex">
              <div className="flex items-center gap-1.5 px-3 py-3 bg-muted border border-r-0 border-border rounded-l-lg text-muted-foreground">
                <Phone className="w-5 h-5" />
                <span className="font-medium text-foreground">+91</span>
              </div>
              <input
                type="tel"
                id="phone"
                value={state.contactInfo.phone || ""}
                onChange={(e) => {
                  // Only allow digits, max 10
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setState((prev) => ({
                    ...prev,
                    contactInfo: { ...prev.contactInfo, phone: value },
                    error: null,
                  }));
                }}
                className={`flex-1 pl-4 pr-10 py-3 rounded-r-lg border ${
                  phoneStatus === 'valid'
                    ? "border-green-500 focus:ring-green-500"
                    : phoneStatus === 'invalid'
                    ? "border-red-500 focus:ring-red-500"
                    : "border-border"
                } bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
                placeholder="98765 43210"
                maxLength={10}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {phoneStatus === 'valid' && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
                {phoneStatus === 'invalid' && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
            {phoneStatus === 'invalid' && (
              <p className="mt-1 text-sm text-red-500">
                {validateContactPhone(state.contactInfo.phone || '')}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Info className="w-3 h-3" />
              For WhatsApp communication with your coach
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={() => {
              const emailError = validateContactEmail(state.contactInfo.email);
              const phoneError = validateContactPhone(state.contactInfo.phone || '');

              if (emailError || phoneError) {
                setState((prev) => ({
                  ...prev,
                  error: emailError || phoneError,
                }));
                return;
              }

              setState((prev) => ({ ...prev, error: null }));
              handleSaveStep("contact_info", state.contactInfo);
              goToNextStep();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  // Render current step form
  const renderCurrentForm = () => {
    const formProps = {
      data: state.assessmentData,
      onSave: handleSaveStep,
      onNext: goToNextStep,
      onPrevious: goToPreviousStep,
      isSubmitting: state.isSaving,
    };

    switch (state.currentStep) {
      case "contact_info":
        return renderContactInfoForm();
      case "personal_info":
        return <PersonalInfoForm {...formProps} />;
      case "goals":
        return <GoalsForm {...formProps} />;
      case "training_background":
        return <TrainingBackgroundForm {...formProps} />;
      case "medical_history":
        return <MedicalHistoryForm {...formProps} />;
      case "blood_reports":
        return <BloodReportsForm {...formProps} />;
      case "lifestyle":
        return <LifestyleForm {...formProps} />;
      case "diet":
        return <DietForm {...formProps} />;
      case "food_preferences":
        return <FoodPreferencesForm {...formProps} />;
      case "supplements":
        return <SupplementsForm {...formProps} />;
      case "skin_hair":
        return <SkinHairForm {...formProps} />;
      case "expectations":
        return <ExpectationsForm {...formProps} />;
      case "consent":
        // Get expected signature from personalInfo (firstName + lastName)
        const personalInfo = state.assessmentData.personalInfo;
        const expectedSignature = personalInfo
          ? `${personalInfo.firstName || ""} ${personalInfo.lastName || ""}`.trim()
          : "";
        return (
          <ConsentForm
            onSubmit={handleSubmit}
            onBack={goToPreviousStep}
            isSubmitting={state.isSubmitting}
            expectedSignature={expectedSignature}
            paymentSettings={paymentSettings}
            paymentData={paymentData}
            onPaymentDataChange={setPaymentData}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const progress = calculateProgress(state.completedSteps);

  return (
    <div className="pb-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-foreground">
            Application Progress
          </span>
          <span className="text-sm text-muted-foreground">{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Navigation */}
      <div className="mb-8 overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {APPLICATION_STEPS.map((step, index) => {
            const Icon = ICON_MAP[STEP_ICONS[step.id]] || User;
            const isCompleted = state.completedSteps.includes(step.id);
            const isCurrent = state.currentStep === step.id;
            const devMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
            const isAccessible =
              devMode ||
              index === 0 ||
              state.completedSteps.includes(APPLICATION_STEPS[index - 1].id);

            return (
              <button
                key={step.id}
                onClick={() => isAccessible && goToStep(step.id)}
                disabled={!isAccessible}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : isAccessible
                    ? "bg-muted text-muted-foreground hover:bg-muted/80"
                    : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                }`}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{index + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {state.error && state.currentStep !== "consent" && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          {state.error}
        </div>
      )}

      {/* Current Form */}
      <div className="bg-card border border-border rounded-xl p-6">
        {renderCurrentForm()}

        {/* Navigation Buttons for assessment forms (not contact_info or consent) */}
        {state.currentStep !== "contact_info" &&
          state.currentStep !== "consent" && (
            <div className="flex justify-between pt-6 mt-6 border-t border-border">
              <button
                onClick={goToPreviousStep}
                className="flex items-center gap-2 px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
              <button
                type="submit"
                form={`form-${state.currentStep}`}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Save & Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ApplyPageContent />
    </Suspense>
  );
}
