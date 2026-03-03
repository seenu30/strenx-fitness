/**
 * Zod Validation Schemas
 *
 * Input validation schemas for API routes to prevent injection attacks
 * and ensure data integrity.
 */

import { z } from "zod";

// ============================================
// Common Schemas
// ============================================

/**
 * UUID schema
 */
export const uuidSchema = z.string().uuid("Invalid UUID format");

/**
 * Email schema with sanitization
 */
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .min(5, "Email too short")
  .max(255, "Email too long")
  .toLowerCase()
  .trim();

/**
 * Phone number schema (Indian format)
 */
export const phoneSchema = z
  .string()
  .regex(/^(\+91)?[6-9]\d{9}$/, "Invalid Indian phone number")
  .transform((val) => val.replace(/\D/g, "").slice(-10));

/**
 * Password schema with complexity requirements
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

/**
 * Name schema (sanitized)
 */
export const nameSchema = z
  .string()
  .min(2, "Name too short")
  .max(100, "Name too long")
  .trim()
  .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters");

/**
 * Date schema (ISO 8601 format)
 */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
  .refine((date) => !isNaN(Date.parse(date)), "Invalid date");

/**
 * Date of birth schema with age validation (18+)
 */
export const dateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
  .refine((date) => {
    const dob = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const actualAge =
      monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())
        ? age - 1
        : age;
    return actualAge >= 18;
  }, "Must be 18 years or older");

/**
 * Positive number schema
 */
export const positiveNumberSchema = z.number().positive("Must be a positive number");

/**
 * Percentage schema (0-100)
 */
export const percentageSchema = z.number().min(0).max(100);

/**
 * Safe string schema (prevents XSS)
 * Use createSafeString(maxLength) for length validation
 */
export const safeStringSchema = z
  .string()
  .transform((val) => val.replace(/<[^>]*>/g, "")) // Strip HTML tags
  .transform((val) => val.trim());

/**
 * Create a safe string with max length
 */
export function createSafeString(maxLength: number, minLength: number = 0) {
  let schema = z.string().max(maxLength);
  if (minLength > 0) {
    schema = schema.min(minLength);
  }
  return schema
    .transform((val) => val.replace(/<[^>]*>/g, ""))
    .transform((val) => val.trim());
}

// Pre-defined safe string schemas for common uses
export const safeString100 = createSafeString(100);
export const safeString200 = createSafeString(200);
export const safeString500 = createSafeString(500);
export const safeStringRequired100 = createSafeString(100, 1);
export const safeStringRequired200 = createSafeString(200, 1);
export const safeStringRequired50 = createSafeString(50, 1);

/**
 * Long text schema (for notes, descriptions)
 */
export const longTextSchema = z
  .string()
  .max(10000, "Text too long")
  .transform((val) => val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ""))
  .transform((val) => val.trim());

// ============================================
// Authentication Schemas
// ============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ============================================
// Profile Schemas
// ============================================

export const profileUpdateSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  phone: phoneSchema.optional(),
  city: createSafeString(100).optional(),
  dateOfBirth: dateOfBirthSchema.optional(),
});

// ============================================
// Onboarding/Assessment Schemas
// ============================================

export const personalInfoSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  dateOfBirth: dateOfBirthSchema,
  gender: z.enum(["male", "female", "other"]),
  height: z.number().min(100).max(250), // cm
  weight: z.number().min(30).max(300), // kg
  occupation: safeString100.optional(),
  city: safeStringRequired100,
});

export const goalsSchema = z.object({
  primaryGoal: z.enum([
    "fat_loss",
    "muscle_gain",
    "maintenance",
    "athletic_performance",
    "general_health",
  ]),
  secondaryGoals: z.array(z.string()).max(3).optional(),
  targetWeight: z.number().min(30).max(300).optional(),
  timeline: z.enum(["1_month", "3_months", "6_months", "12_months", "ongoing"]),
  motivation: longTextSchema.optional(),
});

export const medicalHistorySchema = z.object({
  hasConditions: z.boolean(),
  conditions: z.array(safeStringSchema).optional(),
  hasSurgeries: z.boolean(),
  surgeries: z.array(safeStringSchema).optional(),
  medications: z.array(safeStringSchema).optional(),
  allergies: z.array(safeStringSchema).optional(),
  familyHistory: longTextSchema.optional(),
});

export const bloodReportSchema = z.object({
  testDate: dateSchema,
  hemoglobin: z.number().min(0).max(30).optional(),
  rbc: z.number().min(0).max(10).optional(),
  wbc: z.number().min(0).max(50000).optional(),
  platelets: z.number().min(0).max(1000000).optional(),
  fastingGlucose: z.number().min(0).max(500).optional(),
  hba1c: z.number().min(0).max(20).optional(),
  totalCholesterol: z.number().min(0).max(500).optional(),
  ldl: z.number().min(0).max(300).optional(),
  hdl: z.number().min(0).max(150).optional(),
  triglycerides: z.number().min(0).max(1000).optional(),
  tsh: z.number().min(0).max(100).optional(),
  t3: z.number().min(0).max(10).optional(),
  t4: z.number().min(0).max(30).optional(),
  vitaminD: z.number().min(0).max(200).optional(),
  vitaminB12: z.number().min(0).max(2000).optional(),
  iron: z.number().min(0).max(500).optional(),
  ferritin: z.number().min(0).max(2000).optional(),
  creatinine: z.number().min(0).max(20).optional(),
  uricAcid: z.number().min(0).max(20).optional(),
});

// ============================================
// Check-in Schemas
// ============================================

export const dailyCheckinSchema = z.object({
  date: dateSchema,
  weight: z.number().min(30).max(300),
  steps: z.number().min(0).max(100000),
  trainingCompleted: z.boolean(),
  trainingNotes: longTextSchema.optional(),
  mealsCompliant: z.boolean(),
  mealNotes: longTextSchema.optional(),
  energyLevel: z.number().min(1).max(10),
  stressLevel: z.number().min(1).max(10),
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.number().min(1).max(10),
  notes: longTextSchema.optional(),
});

export const weeklyCheckinSchema = z.object({
  weekStartDate: dateSchema,
  weight: z.number().min(30).max(300),
  measurements: z.object({
    chest: z.number().min(50).max(200).optional(),
    waist: z.number().min(40).max(200).optional(),
    hips: z.number().min(50).max(200).optional(),
    leftArm: z.number().min(15).max(60).optional(),
    rightArm: z.number().min(15).max(60).optional(),
    leftThigh: z.number().min(30).max(100).optional(),
    rightThigh: z.number().min(30).max(100).optional(),
  }).optional(),
  weeklyReflection: longTextSchema.optional(),
  questionsForCoach: longTextSchema.optional(),
  challengesFaced: longTextSchema.optional(),
  winsThisWeek: longTextSchema.optional(),
});

// ============================================
// Messaging Schemas
// ============================================

export const messageSchema = z.object({
  conversationId: uuidSchema,
  content: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
  messageType: z.enum(["text", "image"]).default("text"),
  imageUrl: z.string().url().optional(),
});

// ============================================
// Plan Schemas
// ============================================

export const nutritionPlanSchema = z.object({
  name: safeStringRequired100,
  totalCalories: z.number().min(1000).max(10000),
  protein: z.number().min(0).max(500),
  carbs: z.number().min(0).max(1000),
  fat: z.number().min(0).max(500),
  mealsPerDay: z.number().min(1).max(10),
  meals: z.array(z.object({
    name: safeStringRequired100,
    time: z.string().regex(/^\d{2}:\d{2}$/),
    calories: z.number().min(0).max(3000),
    protein: z.number().min(0).max(200),
    carbs: z.number().min(0).max(500),
    fat: z.number().min(0).max(200),
    items: z.array(z.object({
      name: safeStringRequired200,
      portion: safeStringRequired100,
      calories: z.number().min(0).max(2000),
    })),
  })),
  notes: longTextSchema.optional(),
});

export const trainingPlanSchema = z.object({
  name: safeStringRequired100,
  daysPerWeek: z.number().min(1).max(7),
  focus: z.enum(["strength", "hypertrophy", "endurance", "fat_loss", "general"]),
  days: z.array(z.object({
    name: safeStringRequired100,
    muscleGroups: z.array(z.string().max(100)).min(1),
    exercises: z.array(z.object({
      name: safeStringRequired200,
      sets: z.number().min(1).max(20),
      reps: safeStringRequired50,
      rest: safeStringRequired50,
      notes: safeString500.optional(),
    })),
  })),
  generalNotes: longTextSchema.optional(),
});

// ============================================
// Subscription Schemas
// ============================================

export const subscriptionSchema = z.object({
  planId: uuidSchema,
  startDate: dateSchema,
  duration: z.enum(["30", "60", "90", "100"]),
  amount: z.number().min(0),
});

export const paymentUpdateSchema = z.object({
  subscriptionId: uuidSchema,
  status: z.enum(["pending", "completed", "failed", "refunded"]),
  paymentMethod: z.enum(["upi", "bank_transfer", "card", "cash"]).optional(),
  reference: safeString100.optional(),
});

// ============================================
// Notification Schemas
// ============================================

export const notificationSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const sendNotificationSchema = z.object({
  userId: uuidSchema.optional(),
  userIds: z.array(uuidSchema).optional(),
  type: z.string().min(1).max(50),
  title: safeStringRequired200,
  body: createSafeString(500, 1),
  url: z.string().url().optional(),
  data: z.record(z.string(), z.string()).optional(),
}).refine((data) => data.userId || (data.userIds && data.userIds.length > 0), {
  message: "Either userId or userIds must be provided",
});

// ============================================
// Application Schemas
// ============================================

export const createApplicationSchema = z.object({
  email: emailSchema,
  phone: z.string().optional().nullable(),
  assessment_data: z.record(z.string(), z.unknown()).optional(),
  completed_steps: z.array(z.string()).optional(),
  progress_percentage: z.number().min(0).max(100).optional(),
  consent_data_processing: z.boolean().optional(),
  consent_marketing: z.boolean().optional(),
  consent_medical_sharing: z.boolean().optional(),
  consent_terms: z.boolean().optional(),
  digital_signature: safeString200.optional().nullable(),
  signature_timestamp: z.string().datetime().optional().nullable(),
  payment_reference: safeString100.optional().nullable(),
  payment_screenshot_url: z.string().url().optional().nullable(),
  payment_screenshot_path: safeString200.optional().nullable(),
});

export const updateApplicationSchema = z.object({
  assessment_data: z.record(z.string(), z.unknown()).optional(),
  current_step: z.string().max(50).optional(),
  completed_steps: z.array(z.string()).optional(),
  progress_percentage: z.number().min(0).max(100).optional(),
  phone: z.string().optional(),
});

export const reviewApplicationSchema = z.object({
  action: z.enum(["approve", "reject"]),
  selected_plan_id: uuidSchema.optional(),
  custom_amount: z.number().min(0).optional(),
  review_notes: longTextSchema.optional(),
  rejection_reason: longTextSchema.optional(),
}).refine((data) => {
  if (data.action === "approve") {
    return data.selected_plan_id !== undefined;
  }
  if (data.action === "reject") {
    return data.rejection_reason !== undefined && data.rejection_reason.length > 0;
  }
  return true;
}, {
  message: "Plan required for approval, reason required for rejection",
});

export const confirmPaymentSchema = z.object({
  payment_reference: safeStringRequired100,
  payment_method: z.enum(["upi", "bank_transfer", "cash", "card", "other"]).optional(),
  custom_amount: z.number().min(0).optional(),
});

export const inviteUserSchema = z.object({
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  phone: z.string().optional(),
});

export const inviteCoachSchema = z.object({
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  specializations: z.string().max(500).optional(),
  experienceYears: z.union([z.string(), z.number()]).optional(),
});

export const inviteClientSchema = z.object({
  email: emailSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  phone: z.string().optional(),
  planId: uuidSchema.optional(),
});

// ============================================
// Search & Filter Schemas
// ============================================

export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const searchSchema = z.object({
  query: safeString200.optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
}).merge(paginationSchema);

export const dateRangeSchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: "Start date must be before end date",
});

// ============================================
// Helper Functions
// ============================================

/**
 * Validate and parse input with schema
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`
  );

  return { success: false, errors };
}

/**
 * Create API response for validation errors
 */
export function validationErrorResponse(errors: string[]) {
  return {
    error: "Validation Error",
    message: "Invalid input data",
    details: errors,
  };
}
