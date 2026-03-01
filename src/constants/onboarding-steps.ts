/**
 * Onboarding assessment sections (11 total)
 */
export const ONBOARDING_STEPS = [
  {
    id: 'personal_info',
    number: 1,
    title: 'Personal Information',
    description: 'Basic details about you',
    icon: 'User',
    required: true,
  },
  {
    id: 'goals',
    number: 2,
    title: 'Transformation Goals',
    description: 'What you want to achieve',
    icon: 'Target',
    required: true,
  },
  {
    id: 'training_background',
    number: 3,
    title: 'Training Background',
    description: 'Your exercise history and preferences',
    icon: 'Dumbbell',
    required: true,
  },
  {
    id: 'medical_history',
    number: 4,
    title: 'Medical History',
    description: 'Important health information',
    icon: 'Heart',
    required: true,
    sensitive: true,
  },
  {
    id: 'blood_reports',
    number: 5,
    title: 'Blood Reports',
    description: 'Lab test values for optimization',
    icon: 'FileText',
    required: false,
    sensitive: true,
  },
  {
    id: 'lifestyle',
    number: 6,
    title: 'Daily Lifestyle',
    description: 'Sleep, stress, and daily routine',
    icon: 'Moon',
    required: true,
  },
  {
    id: 'diet',
    number: 7,
    title: 'Current Diet',
    description: 'Your eating habits and patterns',
    icon: 'UtensilsCrossed',
    required: true,
  },
  {
    id: 'food_preferences',
    number: 8,
    title: 'Food Preferences',
    description: 'Foods you like, dislike, or avoid',
    icon: 'Apple',
    required: true,
  },
  {
    id: 'supplements',
    number: 9,
    title: 'Supplements',
    description: 'Current and past supplement use',
    icon: 'Pill',
    required: false,
  },
  {
    id: 'skin_hair',
    number: 10,
    title: 'Skin, Hair & Recovery',
    description: 'Additional health concerns',
    icon: 'Sparkles',
    required: false,
  },
  {
    id: 'expectations',
    number: 11,
    title: 'Expectations',
    description: 'What you expect from this program',
    icon: 'MessageSquare',
    required: true,
  },
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]['id'];

/**
 * Get step by ID
 */
export function getStepById(id: string) {
  return ONBOARDING_STEPS.find((step) => step.id === id);
}

/**
 * Get step index by ID
 */
export function getStepIndex(id: string): number {
  return ONBOARDING_STEPS.findIndex((step) => step.id === id);
}

/**
 * Get next step ID
 */
export function getNextStepId(currentId: string): string | null {
  const currentIndex = getStepIndex(currentId);
  if (currentIndex === -1 || currentIndex >= ONBOARDING_STEPS.length - 1) {
    return null;
  }
  return ONBOARDING_STEPS[currentIndex + 1].id;
}

/**
 * Get previous step ID
 */
export function getPreviousStepId(currentId: string): string | null {
  const currentIndex = getStepIndex(currentId);
  if (currentIndex <= 0) {
    return null;
  }
  return ONBOARDING_STEPS[currentIndex - 1].id;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(completedSteps: string[]): number {
  const requiredSteps = ONBOARDING_STEPS.filter((step) => step.required);
  const completedRequired = completedSteps.filter((id) =>
    requiredSteps.some((step) => step.id === id)
  );
  return Math.round((completedRequired.length / requiredSteps.length) * 100);
}
