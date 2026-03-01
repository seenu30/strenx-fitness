"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

interface AssessmentRow {
  assess_personal: Record<string, unknown>[];
  assess_goals: Record<string, unknown>[];
  assess_training: Record<string, unknown>[];
  assess_medical: Record<string, unknown>[];
  assess_blood_reports: Record<string, unknown>[];
  assess_lifestyle: Record<string, unknown>[];
  assess_diet: Record<string, unknown>[];
  assess_food_preferences: Record<string, unknown>[];
  assess_supplements: Record<string, unknown>[];
  assess_skin_hair: Record<string, unknown>[];
  assess_expectations: Record<string, unknown>[];
}
import { ONBOARDING_STEPS, getStepIndex } from "@/constants/onboarding-steps";
import type {
  AssessmentData,
  OnboardingState,
  PersonalInfoData,
  GoalsData,
  TrainingBackgroundData,
  MedicalHistoryData,
  BloodReportsData,
  LifestyleData,
  DietData,
  FoodPreferencesData,
  SupplementsData,
  SkinHairData,
  ExpectationsData,
} from "@/types/onboarding";

// Form components
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
import ConsentForm from "@/components/forms/onboarding/ConsentForm";

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
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
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
};

export default function OnboardingPage() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>({
    currentStep: "personal_info",
    completedSteps: [],
    data: {},
    isSubmitting: false,
    error: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showConsent, setShowConsent] = useState(false);

  // Load saved progress
  useEffect(() => {
    async function loadProgress() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Check if onboarding is already completed
        const { data: client } = await supabase
          .from("clients")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .single() as { data: { onboarding_completed: boolean } | null };

        if (client?.onboarding_completed) {
          router.push("/dashboard");
          return;
        }

        // Load existing assessment data
        const { data: assessment } = await supabase
          .from("client_assessments")
          .select("*, assess_personal(*), assess_goals(*), assess_training(*), assess_medical(*), assess_blood_reports(*), assess_lifestyle(*), assess_diet(*), assess_food_preferences(*), assess_supplements(*), assess_skin_hair(*), assess_expectations(*)")
          .eq("user_id", user.id)
          .single() as { data: AssessmentRow | null };

        if (assessment) {
          // Map loaded data to state
          const loadedData: AssessmentData = {};
          const completedSteps: string[] = [];

          if (assessment.assess_personal?.[0]) {
            loadedData.personalInfo = assessment.assess_personal[0] as unknown as PersonalInfoData;
            completedSteps.push("personal_info");
          }
          if (assessment.assess_goals?.[0]) {
            loadedData.goals = assessment.assess_goals[0] as unknown as GoalsData;
            completedSteps.push("goals");
          }
          if (assessment.assess_training?.[0]) {
            loadedData.trainingBackground = assessment.assess_training[0] as unknown as TrainingBackgroundData;
            completedSteps.push("training_background");
          }
          if (assessment.assess_medical?.[0]) {
            loadedData.medicalHistory = assessment.assess_medical[0] as unknown as MedicalHistoryData;
            completedSteps.push("medical_history");
          }
          if (assessment.assess_blood_reports?.[0]) {
            loadedData.bloodReports = assessment.assess_blood_reports[0] as unknown as BloodReportsData;
            completedSteps.push("blood_reports");
          }
          if (assessment.assess_lifestyle?.[0]) {
            loadedData.lifestyle = assessment.assess_lifestyle[0] as unknown as LifestyleData;
            completedSteps.push("lifestyle");
          }
          if (assessment.assess_diet?.[0]) {
            loadedData.diet = assessment.assess_diet[0] as unknown as DietData;
            completedSteps.push("diet");
          }
          if (assessment.assess_food_preferences?.[0]) {
            loadedData.foodPreferences = assessment.assess_food_preferences[0] as unknown as FoodPreferencesData;
            completedSteps.push("food_preferences");
          }
          if (assessment.assess_supplements?.[0]) {
            loadedData.supplements = assessment.assess_supplements[0] as unknown as SupplementsData;
            completedSteps.push("supplements");
          }
          if (assessment.assess_skin_hair?.[0]) {
            loadedData.skinHair = assessment.assess_skin_hair[0] as unknown as SkinHairData;
            completedSteps.push("skin_hair");
          }
          if (assessment.assess_expectations?.[0]) {
            loadedData.expectations = assessment.assess_expectations[0] as unknown as ExpectationsData;
            completedSteps.push("expectations");
          }

          setState((prev) => ({
            ...prev,
            data: loadedData,
            completedSteps,
            currentStep: completedSteps.length > 0
              ? ONBOARDING_STEPS[Math.min(completedSteps.length, ONBOARDING_STEPS.length - 1)].id
              : "personal_info",
          }));
        }
      } catch (error) {
        console.error("Error loading progress:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProgress();
  }, [router]);

  // Handle step data save
  const handleSaveStep = useCallback((stepId: string, data: unknown) => {
    setState((prev) => ({
      ...prev,
      data: { ...prev.data, [stepId]: data },
      completedSteps: prev.completedSteps.includes(stepId)
        ? prev.completedSteps
        : [...prev.completedSteps, stepId],
      error: null,
    }));
  }, []);

  // Navigate to step
  const goToStep = useCallback((stepId: string) => {
    setState((prev) => ({ ...prev, currentStep: stepId, error: null }));
  }, []);

  // Go to next step
  const goToNextStep = useCallback(() => {
    const currentIndex = getStepIndex(state.currentStep);
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      const nextStep = ONBOARDING_STEPS[currentIndex + 1];
      setState((prev) => ({ ...prev, currentStep: nextStep.id, error: null }));
    } else {
      // Last step completed, show consent
      setShowConsent(true);
    }
  }, [state.currentStep]);

  // Go to previous step
  const goToPreviousStep = useCallback(() => {
    const currentIndex = getStepIndex(state.currentStep);
    if (currentIndex > 0) {
      const prevStep = ONBOARDING_STEPS[currentIndex - 1];
      setState((prev) => ({ ...prev, currentStep: prevStep.id, error: null }));
    }
  }, [state.currentStep]);

  // Handle final submission
  const handleFinalSubmit = async () => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      // Mark onboarding as complete
      const { error } = await (supabase as SupabaseClient)
        .from("clients")
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: "Failed to complete onboarding. Please try again.",
      }));
    }
  };

  // Render current form
  const renderCurrentForm = () => {
    const props = {
      data: state.data,
      onSave: handleSaveStep,
      onNext: goToNextStep,
      onPrevious: goToPreviousStep,
      isSubmitting: state.isSubmitting,
    };

    switch (state.currentStep) {
      case "personal_info":
        return <PersonalInfoForm {...props} />;
      case "goals":
        return <GoalsForm {...props} />;
      case "training_background":
        return <TrainingBackgroundForm {...props} />;
      case "medical_history":
        return <MedicalHistoryForm {...props} />;
      case "blood_reports":
        return <BloodReportsForm {...props} />;
      case "lifestyle":
        return <LifestyleForm {...props} />;
      case "diet":
        return <DietForm {...props} />;
      case "food_preferences":
        return <FoodPreferencesForm {...props} />;
      case "supplements":
        return <SupplementsForm {...props} />;
      case "skin_hair":
        return <SkinHairForm {...props} />;
      case "expectations":
        return <ExpectationsForm {...props} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 text-primary mx-auto mb-4"
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
          <p className="text-muted-foreground">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (showConsent) {
    return (
      <ConsentForm
        onSubmit={handleFinalSubmit}
        onBack={() => setShowConsent(false)}
        isSubmitting={state.isSubmitting}
      />
    );
  }

  const currentStepIndex = getStepIndex(state.currentStep);
  const currentStepData = ONBOARDING_STEPS[currentStepIndex];
  const progress = Math.round(((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100);

  return (
    <div className="space-y-8">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStepIndex + 1} of {ONBOARDING_STEPS.length}</span>
          <span>{progress}% complete</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 gap-2">
        {ONBOARDING_STEPS.map((step, index) => {
          const Icon = ICON_MAP[step.icon] || User;
          const isCompleted = state.completedSteps.includes(step.id);
          const isCurrent = state.currentStep === step.id;
          const isAccessible = index <= currentStepIndex || isCompleted;

          return (
            <button
              key={step.id}
              onClick={() => isAccessible && goToStep(step.id)}
              disabled={!isAccessible}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : isCompleted
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : isAccessible
                  ? "bg-muted text-foreground hover:bg-secondary"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {isCompleted && !isCurrent ? (
                <Check className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{step.title}</span>
              <span className="sm:hidden">{step.number}</span>
              {"sensitive" in step && step.sensitive && (
                <Shield className="w-3 h-3 text-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Current step header */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-start gap-4 mb-6">
          {(() => {
            const Icon = ICON_MAP[currentStepData.icon] || User;
            return (
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6 text-primary" />
              </div>
            );
          })()}
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {currentStepData.title}
            </h2>
            <p className="text-muted-foreground mt-1">
              {currentStepData.description}
            </p>
            {"sensitive" in currentStepData && currentStepData.sensitive && (
              <p className="text-sm text-primary mt-2 flex items-center gap-1">
                <Shield className="w-4 h-4" />
                This information is encrypted and kept confidential
              </p>
            )}
          </div>
        </div>

        {/* Error display */}
        {state.error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
            {state.error}
          </div>
        )}

        {/* Form content */}
        {renderCurrentForm()}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          <button
            onClick={goToPreviousStep}
            disabled={currentStepIndex === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              currentStepIndex === 0
                ? "text-muted-foreground cursor-not-allowed"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            type="submit"
            form={`form-${state.currentStep}`}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            {currentStepIndex === ONBOARDING_STEPS.length - 1 ? "Review & Submit" : "Continue"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
