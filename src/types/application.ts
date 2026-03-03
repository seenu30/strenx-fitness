/**
 * Client Application types for pre-login onboarding
 */

import { AssessmentData } from './onboarding';

// Application status enum matching database
export type ApplicationStatus =
  | 'draft'           // Incomplete, in progress
  | 'submitted'       // Complete, awaiting review
  | 'approved'        // Approved, pending payment
  | 'payment_received' // Payment confirmed, ready for invite
  | 'invited'         // Invite email sent
  | 'completed'       // Client has set password and is active
  | 'rejected';       // Application rejected

// Contact information (Step 0 - before assessment)
export interface ContactInfo {
  email: string;
  phone?: string;
}

// Consent data
export interface ConsentData {
  dataProcessing: boolean;
  marketing: boolean;
  medicalSharing: boolean;
  terms: boolean;
  timestamp?: string;
}

// Full client application record from database
export interface ClientApplication {
  id: string;
  email: string;
  phone?: string | null;
  assessment_data: AssessmentData;
  current_step: string;
  completed_steps: string[];
  progress_percentage: number;
  status: ApplicationStatus;
  submitted_at?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  rejection_reason?: string | null;
  selected_plan_id?: string | null;
  custom_amount?: number | null;
  payment_confirmed: boolean;
  payment_confirmed_at?: string | null;
  payment_confirmed_by?: string | null;
  payment_reference?: string | null;
  payment_method?: string | null;
  payment_screenshot_url?: string | null;
  payment_screenshot_path?: string | null;
  consent_data_processing: boolean;
  consent_marketing: boolean;
  consent_medical_sharing: boolean;
  consent_terms: boolean;
  consent_timestamp?: string | null;
  converted_client_id?: string | null;
  converted_at?: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

// Application with joined plan data for coach dashboard
export interface ApplicationWithPlan extends ClientApplication {
  plan?: {
    id: string;
    name: string;
    price: number;
    duration_days: number;
  } | null;
  reviewer?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

// Application state for the public form
export interface ApplicationFormState {
  applicationId: string | null;
  contactInfo: ContactInfo;
  assessmentData: AssessmentData;
  consent: ConsentData;
  currentStep: string;
  completedSteps: string[];
  isSubmitting: boolean;
  isSaving: boolean;
  error: string | null;
}

// API request types
export interface CreateApplicationRequest {
  email: string;
  phone?: string;
}

export interface UpdateApplicationRequest {
  assessment_data?: AssessmentData;
  current_step?: string;
  completed_steps?: string[];
  progress_percentage?: number;
}

export interface SubmitApplicationRequest {
  consent_data_processing: boolean;
  consent_marketing: boolean;
  consent_medical_sharing: boolean;
  consent_terms: boolean;
}

export interface ReviewApplicationRequest {
  action: 'approve' | 'reject';
  selected_plan_id?: string;
  custom_amount?: number;
  review_notes?: string;
  rejection_reason?: string;
}

export interface ConfirmPaymentRequest {
  payment_reference: string;
  payment_method: string;
  custom_amount?: number;
}

// API response types
export interface ApplicationResponse {
  success: boolean;
  application?: ClientApplication;
  error?: string;
}

export interface ApplicationListResponse {
  success: boolean;
  applications?: ApplicationWithPlan[];
  error?: string;
}

// Application steps configuration
export const APPLICATION_STEPS = [
  { id: 'contact_info', label: 'Contact Info', required: true },
  { id: 'personal_info', label: 'Personal Info', required: true },
  { id: 'goals', label: 'Goals', required: true },
  { id: 'training_background', label: 'Training', required: true },
  { id: 'medical_history', label: 'Medical History', required: true },
  { id: 'blood_reports', label: 'Blood Reports', required: false },
  { id: 'lifestyle', label: 'Lifestyle', required: true },
  { id: 'diet', label: 'Diet', required: true },
  { id: 'food_preferences', label: 'Food Preferences', required: true },
  { id: 'supplements', label: 'Supplements', required: false },
  { id: 'skin_hair', label: 'Skin & Hair', required: false },
  { id: 'expectations', label: 'Expectations', required: true },
  { id: 'consent', label: 'Consent', required: true },
] as const;

export type ApplicationStepId = typeof APPLICATION_STEPS[number]['id'];

// Helper to calculate progress
export function calculateProgress(completedSteps: string[]): number {
  const requiredSteps = APPLICATION_STEPS.filter(s => s.required);
  const completedRequired = completedSteps.filter(s =>
    requiredSteps.some(rs => rs.id === s)
  );
  return Math.round((completedRequired.length / requiredSteps.length) * 100);
}

// Status badge helpers
export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  approved: 'bg-yellow-100 text-yellow-700',
  payment_received: 'bg-green-100 text-green-700',
  invited: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  payment_received: 'Payment Received',
  invited: 'Invite Sent',
  completed: 'Completed',
  rejected: 'Rejected',
};
