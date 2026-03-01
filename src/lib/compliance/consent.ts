/**
 * DPDP 2023 Consent Management
 *
 * Handles consent collection, storage, and verification according to
 * India's Digital Personal Data Protection Act 2023.
 */

export type ConsentType =
  | "data_collection" // Basic data collection
  | "data_processing" // Processing for coaching services
  | "medical_data" // Sensitive medical information
  | "photo_storage" // Progress photos
  | "blood_reports" // Blood test results
  | "marketing" // Marketing communications
  | "analytics" // Usage analytics
  | "third_party"; // Third-party sharing (if any)

export type ConsentStatus = "granted" | "denied" | "withdrawn" | "expired";

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  status: ConsentStatus;
  version: string; // Privacy policy version
  grantedAt?: string;
  withdrawnAt?: string;
  expiresAt?: string;
  ipAddress?: string;
  userAgent?: string;
  method: "explicit" | "implicit"; // How consent was obtained
  purpose: string; // Clear description of why consent is needed
}

export interface ConsentRequest {
  consentType: ConsentType;
  purpose: string;
  dataCategories: string[];
  retentionPeriod: string;
  thirdPartySharing: boolean;
  withdrawalProcess: string;
}

/**
 * Required consents for using the platform
 */
export const REQUIRED_CONSENTS: ConsentType[] = [
  "data_collection",
  "data_processing",
];

/**
 * Optional consents
 */
export const OPTIONAL_CONSENTS: ConsentType[] = [
  "medical_data",
  "photo_storage",
  "blood_reports",
  "marketing",
  "analytics",
];

/**
 * Consent descriptions for display
 */
export const CONSENT_DESCRIPTIONS: Record<ConsentType, ConsentRequest> = {
  data_collection: {
    consentType: "data_collection",
    purpose:
      "Collection of your personal information including name, email, phone number, and fitness goals to provide coaching services",
    dataCategories: ["Personal identification", "Contact information", "Fitness goals"],
    retentionPeriod: "Duration of active subscription plus 3 years",
    thirdPartySharing: false,
    withdrawalProcess:
      "You can withdraw consent at any time through Settings > Privacy > Manage Consent",
  },
  data_processing: {
    consentType: "data_processing",
    purpose:
      "Processing your data to create personalized nutrition and training plans, track progress, and provide coaching feedback",
    dataCategories: ["Check-in data", "Weight logs", "Compliance data", "Coach communications"],
    retentionPeriod: "Duration of active subscription plus 3 years",
    thirdPartySharing: false,
    withdrawalProcess:
      "Withdrawing this consent will end your coaching services. Contact support for assistance.",
  },
  medical_data: {
    consentType: "medical_data",
    purpose:
      "Collection and storage of your medical history, conditions, and medications to ensure safe and appropriate fitness recommendations",
    dataCategories: [
      "Medical conditions",
      "Medications",
      "Allergies",
      "Surgeries",
      "Family medical history",
    ],
    retentionPeriod: "Duration of active subscription plus 7 years (medical records requirement)",
    thirdPartySharing: false,
    withdrawalProcess:
      "You can request deletion of medical data, but this may limit our ability to provide safe coaching",
  },
  photo_storage: {
    consentType: "photo_storage",
    purpose:
      "Storage of progress photos to track your physical transformation and share with your coach",
    dataCategories: ["Progress photos", "Photo metadata"],
    retentionPeriod: "Duration of active subscription plus 1 year, or until you request deletion",
    thirdPartySharing: false,
    withdrawalProcess:
      "You can delete individual photos or all photos through Settings > Privacy > My Data",
  },
  blood_reports: {
    consentType: "blood_reports",
    purpose:
      "Storage of blood test results to monitor health markers and optimize your nutrition plan",
    dataCategories: ["Blood test values", "Lab reports", "Test dates"],
    retentionPeriod: "Duration of active subscription plus 7 years (medical records requirement)",
    thirdPartySharing: false,
    withdrawalProcess:
      "You can request deletion of blood reports through Settings > Privacy > My Data",
  },
  marketing: {
    consentType: "marketing",
    purpose:
      "Sending promotional emails about new features, offers, and fitness tips",
    dataCategories: ["Email address", "Preferences"],
    retentionPeriod: "Until consent is withdrawn",
    thirdPartySharing: false,
    withdrawalProcess:
      "Unsubscribe link in every email or Settings > Privacy > Communication Preferences",
  },
  analytics: {
    consentType: "analytics",
    purpose:
      "Analyzing app usage patterns to improve our services and user experience",
    dataCategories: ["Usage data", "Device information", "Feature usage"],
    retentionPeriod: "2 years (aggregated and anonymized)",
    thirdPartySharing: false,
    withdrawalProcess: "Settings > Privacy > Analytics",
  },
  third_party: {
    consentType: "third_party",
    purpose: "Sharing data with third-party services for enhanced functionality",
    dataCategories: ["Varies by integration"],
    retentionPeriod: "As per third-party policies",
    thirdPartySharing: true,
    withdrawalProcess: "Settings > Privacy > Third-party Integrations",
  },
};

/**
 * Current privacy policy version
 * Update this when privacy policy changes
 */
export const CURRENT_PRIVACY_VERSION = "1.0.0";

/**
 * Check if user has all required consents
 */
export function hasRequiredConsents(consents: ConsentRecord[]): boolean {
  const grantedConsents = consents
    .filter((c) => c.status === "granted")
    .map((c) => c.consentType);

  return REQUIRED_CONSENTS.every((required) => grantedConsents.includes(required));
}

/**
 * Check if specific consent is granted
 */
export function hasConsent(
  consents: ConsentRecord[],
  consentType: ConsentType
): boolean {
  const consent = consents.find((c) => c.consentType === consentType);
  return consent?.status === "granted";
}

/**
 * Check if consent needs renewal (privacy policy updated)
 */
export function needsConsentRenewal(consent: ConsentRecord): boolean {
  if (consent.status !== "granted") return false;
  return consent.version !== CURRENT_PRIVACY_VERSION;
}

/**
 * Get consents that need renewal
 */
export function getConsentsNeedingRenewal(consents: ConsentRecord[]): ConsentRecord[] {
  return consents.filter(needsConsentRenewal);
}

/**
 * Create a consent record
 */
export function createConsentRecord(
  userId: string,
  consentType: ConsentType,
  granted: boolean,
  metadata?: { ipAddress?: string; userAgent?: string }
): Omit<ConsentRecord, "id"> {
  const now = new Date().toISOString();
  return {
    userId,
    consentType,
    status: granted ? "granted" : "denied",
    version: CURRENT_PRIVACY_VERSION,
    grantedAt: granted ? now : undefined,
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
    method: "explicit",
    purpose: CONSENT_DESCRIPTIONS[consentType].purpose,
  };
}

/**
 * Withdraw consent
 */
export function withdrawConsent(consent: ConsentRecord): ConsentRecord {
  return {
    ...consent,
    status: "withdrawn",
    withdrawnAt: new Date().toISOString(),
  };
}

/**
 * Get user-friendly consent summary
 */
export function getConsentSummary(consents: ConsentRecord[]): {
  required: { type: ConsentType; granted: boolean }[];
  optional: { type: ConsentType; granted: boolean }[];
  needsRenewal: ConsentType[];
} {
  const grantedTypes = new Set(
    consents.filter((c) => c.status === "granted").map((c) => c.consentType)
  );

  return {
    required: REQUIRED_CONSENTS.map((type) => ({
      type,
      granted: grantedTypes.has(type),
    })),
    optional: OPTIONAL_CONSENTS.map((type) => ({
      type,
      granted: grantedTypes.has(type),
    })),
    needsRenewal: getConsentsNeedingRenewal(consents).map((c) => c.consentType),
  };
}
