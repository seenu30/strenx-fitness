/**
 * Onboarding form types
 */

// Personal Info (Section 1)
export interface PersonalInfoData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  heightCm: number;
  weightKg: number;
  occupation: string;
  city: string;
}

// Goals (Section 2)
export interface GoalsData {
  primaryGoal: string;
  secondaryGoals: string[];
  targetWeightKg?: number;
  targetTimelineWeeks: number;
  motivationLevel: number; // 1-10
  commitmentHoursPerWeek: number;
  previousAttempts?: string;
}

// Training Background (Section 3)
export interface TrainingBackgroundData {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  currentTrainingFrequency: number; // days per week
  currentTrainingStyle: string[];
  preferredTrainingStyle: string[];
  gymAccess: boolean;
  homeEquipment: string[];
  injuries: string[];
  physicalLimitations?: string;
}

// Medical History (Section 4) - Encrypted
export interface MedicalHistoryData {
  hasHeartCondition: boolean;
  heartConditionDetails?: string;
  hasDiabetes: boolean;
  diabetesType?: string;
  diabetesControlled?: boolean;
  hasHypertension: boolean;
  hypertensionControlled?: boolean;
  hasThyroidCondition: boolean;
  thyroidType?: string;
  hasPCOS: boolean;
  hasEatingDisorderHistory: boolean;
  recentSurgery: boolean;
  surgeryDetails?: string;
  isPregnant: boolean;
  pregnancyWeeks?: number;
  currentMedications: string[];
  allergies: string[];
  otherConditions?: string;
}

// Blood Reports (Section 5) - Encrypted
export interface BloodReportsData {
  hasRecentReports: boolean;
  reportDate?: string;
  labName?: string;
  // CBC
  hemoglobin?: number;
  rbc?: number;
  wbc?: number;
  platelets?: number;
  // Thyroid
  tsh?: number;
  t3?: number;
  t4?: number;
  // Lipid Profile
  totalCholesterol?: number;
  ldl?: number;
  hdl?: number;
  triglycerides?: number;
  // Diabetes
  fastingGlucose?: number;
  hba1c?: number;
  // Vitamins
  vitaminD?: number;
  vitaminB12?: number;
  iron?: number;
  ferritin?: number;
  // Liver
  sgot?: number;
  sgpt?: number;
  // Kidney
  creatinine?: number;
  uricAcid?: number;
}

// Lifestyle (Section 6)
export interface LifestyleData {
  sleepHours: number;
  sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';
  sleepIssues: string[];
  stressLevel: number; // 1-10
  stressSources: string[];
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  dailySteps?: number;
  workType: 'desk_job' | 'standing' | 'physical_labor' | 'mixed' | 'work_from_home';
  screenTimeHours: number;
}

// Diet (Section 7)
export interface DietData {
  dietPreference: 'vegetarian' | 'eggetarian' | 'non_vegetarian' | 'vegan';
  mealsPerDay: number;
  mealTimings: string[];
  eatsOutFrequency: 'never' | 'rarely' | 'occasionally' | 'frequently' | 'daily';
  cookingFrequency: 'never' | 'rarely' | 'occasionally' | 'frequently' | 'daily';
  waterIntakeLiters: number;
  alcoholFrequency: 'never' | 'rarely' | 'occasionally' | 'frequently' | 'daily';
  smokingStatus: 'never' | 'former' | 'current';
  caffeineCupsPerDay: number;
  snackingHabits?: string;
}

// Food Preferences (Section 8)
export interface FoodPreferencesData {
  likedFoods: string[];
  dislikedFoods: string[];
  foodAllergies: string[];
  foodIntolerances: string[];
  religiousRestrictions?: string;
  cuisinePreferences: string[];
  spiceToleranceLevel: 'none' | 'mild' | 'medium' | 'hot' | 'very_hot';
}

// Supplements (Section 9)
export interface SupplementsData {
  currentSupplements: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  pastSupplements: Array<{
    name: string;
    duration: string;
    reason_stopped?: string;
  }>;
  willingToTakeSupplements: boolean;
  supplementBudget?: string;
}

// Skin & Hair (Section 10)
export interface SkinHairData {
  skinType: 'dry' | 'oily' | 'combination' | 'normal';
  skinConcerns: string[];
  hairConcerns: string[];
  nailConcerns: string[];
  recoveryIssues: string[];
  digestiveIssues: string[];
}

// Expectations (Section 11)
export interface ExpectationsData {
  expectations: string;
  previousChallenges: string;
  whatWorkedBefore?: string;
  whatDidntWork?: string;
  willingnessToTrack: number; // 1-10
  preferredCommunication: 'app_only' | 'whatsapp' | 'calls' | 'any';
  questionsForCoach?: string;
}

// Combined assessment data
export interface AssessmentData {
  personalInfo?: PersonalInfoData;
  goals?: GoalsData;
  trainingBackground?: TrainingBackgroundData;
  medicalHistory?: MedicalHistoryData;
  bloodReports?: BloodReportsData;
  lifestyle?: LifestyleData;
  diet?: DietData;
  foodPreferences?: FoodPreferencesData;
  supplements?: SupplementsData;
  skinHair?: SkinHairData;
  expectations?: ExpectationsData;
}

// Onboarding state
export interface OnboardingState {
  currentStep: string;
  completedSteps: string[];
  data: AssessmentData;
  isSubmitting: boolean;
  error: string | null;
}

// Generic form props for all onboarding forms
export interface BaseFormProps {
  data: AssessmentData;
  onSave: (stepId: string, data: unknown) => void;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}
