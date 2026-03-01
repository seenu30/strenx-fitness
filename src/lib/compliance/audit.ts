/**
 * Audit Logging for DPDP Compliance
 *
 * Provides immutable audit trails for data access, modifications,
 * and consent changes as required by DPDP 2023.
 */

export type AuditAction =
  // Data access
  | "view_medical_data"
  | "view_blood_reports"
  | "view_progress_photos"
  | "view_assessment"
  | "export_data"
  // Data modifications
  | "create_record"
  | "update_record"
  | "delete_record"
  | "anonymize_record"
  // Consent
  | "consent_granted"
  | "consent_withdrawn"
  | "consent_expired"
  // Authentication
  | "login"
  | "logout"
  | "password_change"
  | "mfa_enabled"
  | "mfa_disabled"
  // Admin actions
  | "admin_access"
  | "role_change"
  | "account_suspended"
  | "account_deleted";

export type AuditSeverity = "info" | "warning" | "critical";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string; // User who performed the action
  targetUserId?: string; // User whose data was accessed (if different)
  action: AuditAction;
  severity: AuditSeverity;
  resourceType: string; // e.g., "medical_data", "progress_photo"
  resourceId?: string; // Specific record ID
  details: Record<string, unknown>; // Additional context
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * Actions that require audit logging
 */
export const AUDITABLE_ACTIONS: Record<AuditAction, {
  severity: AuditSeverity;
  description: string;
  retentionDays: number;
}> = {
  // Data access
  view_medical_data: {
    severity: "warning",
    description: "Viewed sensitive medical data",
    retentionDays: 2555, // 7 years
  },
  view_blood_reports: {
    severity: "warning",
    description: "Viewed blood report data",
    retentionDays: 2555,
  },
  view_progress_photos: {
    severity: "info",
    description: "Viewed progress photos",
    retentionDays: 365,
  },
  view_assessment: {
    severity: "info",
    description: "Viewed assessment data",
    retentionDays: 365,
  },
  export_data: {
    severity: "warning",
    description: "Exported user data",
    retentionDays: 2555,
  },

  // Data modifications
  create_record: {
    severity: "info",
    description: "Created a new record",
    retentionDays: 365,
  },
  update_record: {
    severity: "info",
    description: "Updated a record",
    retentionDays: 365,
  },
  delete_record: {
    severity: "warning",
    description: "Deleted a record",
    retentionDays: 2555,
  },
  anonymize_record: {
    severity: "warning",
    description: "Anonymized a record",
    retentionDays: 2555,
  },

  // Consent
  consent_granted: {
    severity: "info",
    description: "User granted consent",
    retentionDays: 2555,
  },
  consent_withdrawn: {
    severity: "warning",
    description: "User withdrew consent",
    retentionDays: 2555,
  },
  consent_expired: {
    severity: "info",
    description: "Consent expired",
    retentionDays: 2555,
  },

  // Authentication
  login: {
    severity: "info",
    description: "User logged in",
    retentionDays: 90,
  },
  logout: {
    severity: "info",
    description: "User logged out",
    retentionDays: 90,
  },
  password_change: {
    severity: "warning",
    description: "Password changed",
    retentionDays: 365,
  },
  mfa_enabled: {
    severity: "info",
    description: "MFA enabled",
    retentionDays: 365,
  },
  mfa_disabled: {
    severity: "warning",
    description: "MFA disabled",
    retentionDays: 365,
  },

  // Admin actions
  admin_access: {
    severity: "warning",
    description: "Admin accessed user data",
    retentionDays: 2555,
  },
  role_change: {
    severity: "critical",
    description: "User role changed",
    retentionDays: 2555,
  },
  account_suspended: {
    severity: "critical",
    description: "Account suspended",
    retentionDays: 2555,
  },
  account_deleted: {
    severity: "critical",
    description: "Account deleted",
    retentionDays: 2555,
  },
};

/**
 * Create an audit log entry
 */
export function createAuditEntry(
  userId: string,
  action: AuditAction,
  resourceType: string,
  options?: {
    targetUserId?: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    success?: boolean;
    errorMessage?: string;
  }
): Omit<AuditLogEntry, "id"> {
  const actionConfig = AUDITABLE_ACTIONS[action];

  return {
    timestamp: new Date().toISOString(),
    userId,
    targetUserId: options?.targetUserId,
    action,
    severity: actionConfig.severity,
    resourceType,
    resourceId: options?.resourceId,
    details: options?.details || {},
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
    sessionId: options?.sessionId,
    success: options?.success ?? true,
    errorMessage: options?.errorMessage,
  };
}

/**
 * Get audit log entries for compliance reporting
 */
export interface AuditQuery {
  userId?: string;
  targetUserId?: string;
  action?: AuditAction | AuditAction[];
  severity?: AuditSeverity | AuditSeverity[];
  resourceType?: string;
  startDate?: string;
  endDate?: string;
  success?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Build SQL WHERE clause for audit queries
 * This is a helper - actual implementation would use Supabase client
 */
export function buildAuditQueryFilters(query: AuditQuery): {
  filters: string[];
  params: Record<string, unknown>;
} {
  const filters: string[] = [];
  const params: Record<string, unknown> = {};

  if (query.userId) {
    filters.push("user_id = :userId");
    params.userId = query.userId;
  }

  if (query.targetUserId) {
    filters.push("target_user_id = :targetUserId");
    params.targetUserId = query.targetUserId;
  }

  if (query.action) {
    if (Array.isArray(query.action)) {
      filters.push("action = ANY(:actions)");
      params.actions = query.action;
    } else {
      filters.push("action = :action");
      params.action = query.action;
    }
  }

  if (query.severity) {
    if (Array.isArray(query.severity)) {
      filters.push("severity = ANY(:severities)");
      params.severities = query.severity;
    } else {
      filters.push("severity = :severity");
      params.severity = query.severity;
    }
  }

  if (query.resourceType) {
    filters.push("resource_type = :resourceType");
    params.resourceType = query.resourceType;
  }

  if (query.startDate) {
    filters.push("timestamp >= :startDate");
    params.startDate = query.startDate;
  }

  if (query.endDate) {
    filters.push("timestamp <= :endDate");
    params.endDate = query.endDate;
  }

  if (query.success !== undefined) {
    filters.push("success = :success");
    params.success = query.success;
  }

  return { filters, params };
}

/**
 * Generate compliance report summary
 */
export interface ComplianceReportSummary {
  period: { start: string; end: string };
  totalEntries: number;
  byAction: Record<AuditAction, number>;
  bySeverity: Record<AuditSeverity, number>;
  failedOperations: number;
  sensitiveDataAccess: number;
  consentChanges: number;
  adminActions: number;
}

/**
 * Format audit entry for display
 */
export function formatAuditEntry(entry: AuditLogEntry): string {
  const timestamp = new Date(entry.timestamp).toLocaleString();
  const actionDesc = AUDITABLE_ACTIONS[entry.action]?.description || entry.action;
  const status = entry.success ? "SUCCESS" : "FAILED";

  let message = `[${timestamp}] [${entry.severity.toUpperCase()}] ${actionDesc}`;
  message += ` | User: ${entry.userId}`;

  if (entry.targetUserId && entry.targetUserId !== entry.userId) {
    message += ` | Target: ${entry.targetUserId}`;
  }

  if (entry.resourceId) {
    message += ` | Resource: ${entry.resourceType}/${entry.resourceId}`;
  }

  message += ` | Status: ${status}`;

  if (entry.errorMessage) {
    message += ` | Error: ${entry.errorMessage}`;
  }

  return message;
}

/**
 * Get actions that access sensitive data (for reporting)
 */
export function getSensitiveDataActions(): AuditAction[] {
  return [
    "view_medical_data",
    "view_blood_reports",
    "export_data",
    "admin_access",
  ];
}

/**
 * Check if action requires additional authorization
 */
export function requiresElevatedAuth(action: AuditAction): boolean {
  return AUDITABLE_ACTIONS[action].severity === "critical";
}
