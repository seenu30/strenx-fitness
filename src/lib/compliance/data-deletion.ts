/**
 * DPDP 2023 Data Deletion (Right to Erasure)
 *
 * Handles data deletion requests according to India's Digital Personal
 * Data Protection Act 2023.
 */

export type DeletionRequestStatus =
  | "pending" // Request submitted
  | "processing" // Being processed
  | "completed" // Deletion complete
  | "rejected" // Request rejected (with reason)
  | "partial"; // Partially completed (some data retained for legal reasons)

export type DataCategory =
  | "personal_info" // Name, email, phone, etc.
  | "assessment_data" // Onboarding questionnaire
  | "medical_data" // Health conditions, medications
  | "blood_reports" // Lab results
  | "progress_photos" // Photos
  | "check_ins" // Daily/weekly check-ins
  | "messages" // Chat history
  | "plans" // Nutrition/training plans
  | "payments" // Payment records
  | "all"; // Everything

export interface DeletionRequest {
  id: string;
  userId: string;
  requestedAt: string;
  processedAt?: string;
  status: DeletionRequestStatus;
  categories: DataCategory[];
  reason?: string; // User's reason for deletion
  rejectionReason?: string; // If rejected
  retainedData?: RetainedDataInfo[]; // Data kept for legal reasons
  processedBy?: string; // Admin who processed
  verificationMethod: "email" | "password" | "support"; // How user verified identity
}

export interface RetainedDataInfo {
  category: DataCategory;
  reason: string;
  retentionPeriod: string;
  legalBasis: string;
}

/**
 * Data retention requirements (legal/business reasons)
 */
export const DATA_RETENTION_REQUIREMENTS: Record<DataCategory, {
  canDelete: boolean;
  minimumRetention?: string;
  legalBasis?: string;
}> = {
  personal_info: {
    canDelete: true,
    minimumRetention: "After subscription ends",
    legalBasis: "Contract fulfillment",
  },
  assessment_data: {
    canDelete: true,
    minimumRetention: "After subscription ends",
    legalBasis: "Contract fulfillment",
  },
  medical_data: {
    canDelete: false, // May need retention for legal liability
    minimumRetention: "7 years after last interaction",
    legalBasis: "Legal obligation - healthcare records",
  },
  blood_reports: {
    canDelete: false,
    minimumRetention: "7 years after last interaction",
    legalBasis: "Legal obligation - healthcare records",
  },
  progress_photos: {
    canDelete: true,
    minimumRetention: "None - immediate deletion allowed",
    legalBasis: "None",
  },
  check_ins: {
    canDelete: true,
    minimumRetention: "After subscription ends",
    legalBasis: "Contract fulfillment",
  },
  messages: {
    canDelete: true,
    minimumRetention: "30 days for support purposes",
    legalBasis: "Legitimate interest",
  },
  plans: {
    canDelete: true,
    minimumRetention: "After subscription ends",
    legalBasis: "Contract fulfillment",
  },
  payments: {
    canDelete: false,
    minimumRetention: "7 years",
    legalBasis: "Legal obligation - financial records, tax compliance",
  },
  all: {
    canDelete: false, // Some data must be retained
    minimumRetention: "Varies by category",
    legalBasis: "Multiple legal bases",
  },
};

/**
 * Tables associated with each data category
 */
export const DATA_CATEGORY_TABLES: Record<DataCategory, string[]> = {
  personal_info: ["users", "clients", "coaches"],
  assessment_data: [
    "client_assessments",
    "assess_personal",
    "assess_goals",
    "assess_training",
    "assess_lifestyle",
    "assess_diet",
    "assess_food_preferences",
    "assess_supplements",
    "assess_skin_hair",
    "assess_expectations",
  ],
  medical_data: ["assess_medical", "assess_blood_reports"],
  blood_reports: ["assess_blood_reports", "blood_report_logs"],
  progress_photos: ["progress_photos"],
  check_ins: ["daily_checkins", "checkin_meals", "checkin_training", "measurements", "weight_logs"],
  messages: ["messages", "conversations"],
  plans: [
    "client_plan_assignments",
    "nutrition_plans",
    "nutrition_plan_versions",
    "meal_items",
    "training_plans",
    "training_plan_versions",
    "training_days",
    "exercise_items",
  ],
  payments: ["payments", "invoices", "subscriptions"],
  all: [], // Handled specially
};

/**
 * Check if a data category can be deleted
 */
export function canDeleteCategory(category: DataCategory): {
  canDelete: boolean;
  reason?: string;
  retentionInfo?: RetainedDataInfo;
} {
  const requirements = DATA_RETENTION_REQUIREMENTS[category];

  if (requirements.canDelete) {
    return { canDelete: true };
  }

  return {
    canDelete: false,
    reason: requirements.legalBasis,
    retentionInfo: {
      category,
      reason: requirements.legalBasis || "Legal requirement",
      retentionPeriod: requirements.minimumRetention || "As required by law",
      legalBasis: requirements.legalBasis || "Legal obligation",
    },
  };
}

/**
 * Validate deletion request
 */
export function validateDeletionRequest(
  categories: DataCategory[],
  hasActiveSubscription: boolean
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  retainedCategories: DataCategory[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const retainedCategories: DataCategory[] = [];

  // Check if user has active subscription
  if (hasActiveSubscription && categories.includes("all")) {
    errors.push(
      "Cannot delete all data while subscription is active. Please cancel your subscription first."
    );
  }

  // Check each category
  for (const category of categories) {
    const { canDelete, reason } = canDeleteCategory(category);
    if (!canDelete) {
      retainedCategories.push(category);
      warnings.push(
        `${category} cannot be fully deleted: ${reason}. Data will be retained as required by law.`
      );
    }
  }

  // Handle "all" category
  if (categories.includes("all")) {
    const allRetained = Object.entries(DATA_RETENTION_REQUIREMENTS)
      .filter(([, req]) => !req.canDelete)
      .map(([cat]) => cat as DataCategory);

    for (const cat of allRetained) {
      if (!retainedCategories.includes(cat)) {
        retainedCategories.push(cat);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    retainedCategories,
  };
}

/**
 * Create a deletion request
 */
export function createDeletionRequest(
  userId: string,
  categories: DataCategory[],
  reason?: string,
  verificationMethod: "email" | "password" | "support" = "password"
): Omit<DeletionRequest, "id"> {
  return {
    userId,
    requestedAt: new Date().toISOString(),
    status: "pending",
    categories,
    reason,
    verificationMethod,
  };
}

/**
 * Get deletion request timeline
 */
export function getDeletionTimeline(): {
  acknowledgment: string;
  processing: string;
  completion: string;
} {
  return {
    acknowledgment: "Within 24 hours",
    processing: "Within 7 days",
    completion: "Within 30 days (as per DPDP Act)",
  };
}

/**
 * Generate deletion confirmation message
 */
export function getDeletionConfirmationMessage(
  request: DeletionRequest
): string {
  const categoryList = request.categories.join(", ");
  const retainedList = request.retainedData?.map((r) => r.category).join(", ");

  let message = `Your data deletion request has been ${request.status}.\n\n`;
  message += `Categories requested for deletion: ${categoryList}\n`;

  if (request.status === "completed") {
    message += `\nThe following data has been permanently deleted from our systems.\n`;
    if (retainedList) {
      message += `\nThe following data has been retained as required by law: ${retainedList}\n`;
      message += `This data will be automatically deleted when the retention period expires.\n`;
    }
  } else if (request.status === "partial") {
    message += `\nSome data could not be deleted due to legal requirements.\n`;
    message += `Retained data: ${retainedList}\n`;
  } else if (request.status === "rejected") {
    message += `\nReason: ${request.rejectionReason}\n`;
  }

  return message;
}

/**
 * Anonymize data instead of deleting (for aggregated analytics)
 */
export function getAnonymizationFields(): Record<string, string[]> {
  return {
    users: ["first_name", "last_name", "email", "phone", "avatar_url"],
    clients: ["notes"],
    messages: ["content"],
    daily_checkins: ["notes"],
  };
}
