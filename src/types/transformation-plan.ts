/**
 * Transformation Plan Types
 *
 * Types for the comprehensive personalized transformation plan system
 * that combines nutrition, training, supplements, and lifestyle guidance.
 */

// ============================================================================
// SECTION TYPES
// ============================================================================

export type TransformationPlanSectionType =
  | 'header'
  | 'blood_report_strategy'
  | 'daily_macros'
  | 'meal_timing'
  | 'morning_drinks'
  | 'bedtime_drink'
  | 'meal_plan'
  | 'snack_ideas'
  | 'supplements'
  | 'training_program'
  | 'progression_strategy'
  | 'recovery_rules'
  | 'checkin_protocol'
  | 'coach_credentials'
  | 'custom';

export type TransformationPlanStatus = 'draft' | 'published' | 'archived';

export type DrinkType = 'morning' | 'bedtime' | 'pre_workout' | 'post_workout' | 'other';

export type SupplementCategory = 'vitamin' | 'mineral' | 'protein' | 'performance' | 'health';

// ============================================================================
// SECTION CONTENT INTERFACES
// ============================================================================

/** Header section - Client info and plan metadata */
export interface HeaderSectionContent {
  clientName: string;
  age: number;
  heightCm: number;
  weightKg: number;
  goal: string;
  phase: string;
  durationWeeks: number;
  coachName: string;
  coachCredentials?: string[];
  logoUrl?: string;
}

/** Blood report analysis and corrective strategy */
export interface BloodReportStrategySectionContent {
  keyObservations: string[];
  primaryFocusAreas: string[];
  recommendations: string[];
}

/** Daily macro targets */
export interface DailyMacrosSectionContent {
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  cardioMinutes?: number;
  cardioCaloriesBurn?: number;
  cardioHeartRateRange?: string;
  notes?: string;
}

/** Meal timing schedule */
export interface MealTimingEntry {
  time: string;
  activity: string;
  notes?: string;
}

export interface MealTimingSectionContent {
  schedule: MealTimingEntry[];
  specialNotes?: string[];
}

/** Morning drinks rotation */
export interface DrinkRecipe {
  name: string;
  ingredients: { name: string; quantity: string; unit?: string }[];
  preparation?: string;
  benefits: string[];
}

export interface MorningDrinksSectionContent {
  drinks: DrinkRecipe[];
  instructions?: string;
}

/** Bedtime drink */
export interface BedtimeDrinkSectionContent {
  drink: DrinkRecipe;
}

/** Meal plan with options */
export interface MealItem {
  foodName: string;
  quantity: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  notes?: string;
}

export interface MealOption {
  optionLabel: string; // "Option A", "Option B"
  items: MealItem[];
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
}

export interface Meal {
  mealNumber: number;
  mealName: string; // "Pre Workout", "Post Workout Breakfast", "Lunch", etc.
  time?: string;
  options: MealOption[];
}

export interface MealPlanSectionContent {
  meals: Meal[];
}

/** Snack ideas for missed meals */
export interface SnackIdea {
  name: string;
  description?: string;
  macros?: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

export interface SnackIdeasSectionContent {
  snacks: SnackIdea[];
  instructions?: string;
}

/** Supplements */
export interface Supplement {
  name: string;
  dosage: string;
  timing: string;
  targetDeficiency?: string;
  notes?: string;
  recheckAfter?: string;
}

export interface SupplementsSectionContent {
  supplements: Supplement[];
  generalNotes?: string[];
}

/** Training program */
export interface TrainingExercise {
  name: string;
  sets: number;
  reps: string;
  rpe?: string;
  restSeconds?: number;
  tempo?: string;
  notes?: string;
  formCues?: string[];
}

export interface TrainingDay {
  dayNumber: number;
  dayName: string; // "Upper Push", "Lower Body", "Pull", etc.
  focusAreas: string[];
  isRestDay?: boolean;
  warmUp?: string[];
  exercises: TrainingExercise[];
  cardio?: {
    type: string;
    duration: string;
    calorieTarget?: number;
    heartRateRange?: string;
  };
  finisher?: string;
}

export interface TrainingProgramSectionContent {
  weeklySplit: string[];
  days: TrainingDay[];
}

/** Progression strategy */
export interface ProgressionWeek {
  weekRange: string; // "Weeks 1-3", "Week 9"
  focus: string;
  description: string;
}

export interface ProgressionStrategySectionContent {
  progression: ProgressionWeek[];
}

/** Recovery rules */
export interface RecoveryRulesSectionContent {
  sleepTarget: string;
  sleepDeadline?: string;
  stepGoal: number;
  sunExposure?: string;
  otherRules: string[];
}

/** Check-in protocol */
export interface CheckinProtocolSectionContent {
  dailyRequirements: string[];
  weeklyRequirements: string[];
}

/** Coach credentials */
export interface CoachCredentialsSectionContent {
  credentials: string[];
}

/** Custom section */
export interface CustomSectionContent {
  [key: string]: unknown;
}

// Union type for all section content
export type SectionContent =
  | HeaderSectionContent
  | BloodReportStrategySectionContent
  | DailyMacrosSectionContent
  | MealTimingSectionContent
  | MorningDrinksSectionContent
  | BedtimeDrinkSectionContent
  | MealPlanSectionContent
  | SnackIdeasSectionContent
  | SupplementsSectionContent
  | TrainingProgramSectionContent
  | ProgressionStrategySectionContent
  | RecoveryRulesSectionContent
  | CheckinProtocolSectionContent
  | CoachCredentialsSectionContent
  | CustomSectionContent;

// ============================================================================
// DATABASE ENTITY INTERFACES
// ============================================================================

/** Transformation plan from database */
export interface TransformationPlan {
  id: string;
  client_id: string;
  created_by: string;
  plan_name: string;
  phase: string | null;
  duration_weeks: number;
  nutrition_plan_version_id: string | null;
  training_plan_version_id: string | null;
  assessment_id: string | null;
  status: TransformationPlanStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Transformation plan version from database */
export interface TransformationPlanVersion {
  id: string;
  plan_id: string;
  version_number: number;
  change_notes: string | null;
  created_by: string;
  plan_snapshot: TransformationPlanSnapshot;
  is_current: boolean;
  created_at: string;
}

/** Transformation plan section from database */
export interface TransformationPlanSection {
  id: string;
  plan_id: string;
  section_type: TransformationPlanSectionType;
  title: string | null;
  content: SectionContent;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Full snapshot stored in version */
export interface TransformationPlanSnapshot {
  plan: Omit<TransformationPlan, 'id' | 'created_at' | 'updated_at'>;
  sections: Omit<TransformationPlanSection, 'id' | 'plan_id' | 'created_at' | 'updated_at'>[];
}

/** Supplement library item */
export interface SupplementLibraryItem {
  id: string;
  name: string;
  category: SupplementCategory | null;
  brand: string | null;
  default_dosage: string | null;
  default_timing: string | null;
  benefits: string[] | null;
  target_deficiencies: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Drink recipe library item */
export interface DrinkRecipeLibraryItem {
  id: string;
  name: string;
  drink_type: DrinkType | null;
  ingredients: { name: string; quantity: string; unit?: string }[];
  preparation: string | null;
  benefits: string[] | null;
  is_active: boolean;
  created_at: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/** Create transformation plan request */
export interface CreateTransformationPlanRequest {
  client_id: string;
  plan_name?: string;
  phase?: string;
  duration_weeks?: number;
  nutrition_plan_version_id?: string;
  training_plan_version_id?: string;
  assessment_id?: string;
}

/** Update transformation plan request */
export interface UpdateTransformationPlanRequest {
  plan_name?: string;
  phase?: string;
  duration_weeks?: number;
  nutrition_plan_version_id?: string;
  training_plan_version_id?: string;
  assessment_id?: string;
}

/** Create/update section request */
export interface UpsertSectionRequest {
  section_type: TransformationPlanSectionType;
  title?: string;
  content: SectionContent;
  is_visible?: boolean;
  sort_order?: number;
}

/** Publish plan request */
export interface PublishPlanRequest {
  change_notes?: string;
}

/** Pull data response */
export interface PullDataResponse {
  header?: Partial<HeaderSectionContent>;
  bloodReportStrategy?: Partial<BloodReportStrategySectionContent>;
  dailyMacros?: Partial<DailyMacrosSectionContent>;
  mealPlan?: Partial<MealPlanSectionContent>;
  trainingProgram?: Partial<TrainingProgramSectionContent>;
  supplements?: Partial<SupplementsSectionContent>;
  coachCredentials?: Partial<CoachCredentialsSectionContent>;
}

/** Transformation plan with sections (joined) */
export interface TransformationPlanWithSections extends TransformationPlan {
  sections: TransformationPlanSection[];
  client?: {
    id: string;
    user_id: string;
    status: string;
  };
  coach?: {
    id: string;
    user_id: string;
    bio: string | null;
    certifications: { name: string; issuer?: string; year?: number }[] | null;
  };
}

// ============================================================================
// UI COMPONENT PROPS
// ============================================================================

/** Props for section editor components */
export interface SectionEditorProps<T extends SectionContent> {
  content: T;
  onChange: (content: T) => void;
  isReadOnly?: boolean;
}

/** Props for section view components */
export interface SectionViewProps<T extends SectionContent> {
  content: T;
  title?: string;
}

/** Default section titles */
export const DEFAULT_SECTION_TITLES: Record<TransformationPlanSectionType, string> = {
  header: 'Personalized Transformation Plan',
  blood_report_strategy: 'Blood Report Corrective Strategy',
  daily_macros: 'Daily Calories & Macros',
  meal_timing: 'Meal Timing Guide',
  morning_drinks: 'Morning Drink Rotation',
  bedtime_drink: 'Before Bed Drink',
  meal_plan: 'Meal Plan',
  snack_ideas: 'Simple Snack Ideas',
  supplements: 'Supplements',
  training_program: 'Training Program',
  progression_strategy: 'Progression Strategy',
  recovery_rules: 'Recovery Rules',
  checkin_protocol: 'Check-in Protocol',
  coach_credentials: 'Coach Credentials',
  custom: 'Custom Section',
};

/** Default sort order for sections */
export const DEFAULT_SECTION_ORDER: TransformationPlanSectionType[] = [
  'header',
  'blood_report_strategy',
  'daily_macros',
  'meal_timing',
  'morning_drinks',
  'bedtime_drink',
  'meal_plan',
  'snack_ideas',
  'supplements',
  'training_program',
  'progression_strategy',
  'recovery_rules',
  'checkin_protocol',
  'coach_credentials',
];
