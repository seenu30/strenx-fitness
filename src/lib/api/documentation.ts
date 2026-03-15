/**
 * API Documentation
 *
 * Comprehensive documentation of all API endpoints for Strenx Fitness.
 * This file serves as both documentation and a type-safe reference.
 */

export interface APIEndpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
  authentication: "required" | "optional" | "none";
  roles?: ("client" | "coach" | "admin")[];
  rateLimit?: string;
  requestBody?: {
    contentType: string;
    schema: string;
    example?: Record<string, unknown>;
  };
  queryParams?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  response: {
    status: number;
    description: string;
    schema?: string;
    example?: Record<string, unknown>;
  }[];
}

export interface APIGroup {
  name: string;
  basePath: string;
  description: string;
  endpoints: APIEndpoint[];
}

/**
 * Complete API Documentation
 */
export const API_DOCUMENTATION: APIGroup[] = [
  // ============================================
  // Authentication
  // ============================================
  {
    name: "Authentication",
    basePath: "/api/auth",
    description: "User authentication and session management",
    endpoints: [
      {
        method: "POST",
        path: "/api/auth/callback",
        description: "Handle OAuth callback and session creation",
        authentication: "none",
        response: [
          { status: 302, description: "Redirect to appropriate dashboard" },
          { status: 400, description: "Invalid callback parameters" },
        ],
      },
      {
        method: "POST",
        path: "/api/auth/login",
        description: "Authenticate user with email and password",
        authentication: "none",
        rateLimit: "5 requests per minute",
        requestBody: {
          contentType: "application/json",
          schema: "loginSchema",
          example: {
            email: "user@example.com",
            password: "SecurePass123!",
          },
        },
        response: [
          { status: 200, description: "Login successful", example: { user: {}, session: {} } },
          { status: 401, description: "Invalid credentials" },
          { status: 429, description: "Too many login attempts" },
        ],
      },
      {
        method: "POST",
        path: "/api/auth/logout",
        description: "Sign out current user and invalidate session",
        authentication: "required",
        response: [
          { status: 200, description: "Logged out successfully" },
        ],
      },
      {
        method: "POST",
        path: "/api/auth/forgot-password",
        description: "Send password reset email",
        authentication: "none",
        rateLimit: "3 requests per hour",
        requestBody: {
          contentType: "application/json",
          schema: "resetPasswordSchema",
        },
        response: [
          { status: 200, description: "Reset email sent if account exists" },
        ],
      },
      {
        method: "POST",
        path: "/api/auth/reset-password",
        description: "Reset password with token",
        authentication: "none",
        requestBody: {
          contentType: "application/json",
          schema: "updatePasswordSchema",
        },
        response: [
          { status: 200, description: "Password reset successful" },
          { status: 400, description: "Invalid or expired token" },
        ],
      },
    ],
  },

  // ============================================
  // Check-ins
  // ============================================
  {
    name: "Check-ins",
    basePath: "/api/check-in",
    description: "Daily and weekly check-in tracking",
    endpoints: [
      {
        method: "GET",
        path: "/api/check-in/daily",
        description: "Get today's check-in or specific date",
        authentication: "required",
        roles: ["client", "coach"],
        queryParams: [
          { name: "date", type: "string (YYYY-MM-DD)", required: false, description: "Check-in date" },
          { name: "clientId", type: "uuid", required: false, description: "Client ID (coach only)" },
        ],
        response: [
          { status: 200, description: "Check-in data" },
          { status: 404, description: "No check-in for date" },
        ],
      },
      {
        method: "POST",
        path: "/api/check-in/daily",
        description: "Submit daily check-in",
        authentication: "required",
        roles: ["client"],
        requestBody: {
          contentType: "application/json",
          schema: "dailyCheckinSchema",
        },
        response: [
          { status: 201, description: "Check-in created" },
          { status: 200, description: "Check-in updated" },
          { status: 400, description: "Validation error" },
        ],
      },
      {
        method: "GET",
        path: "/api/check-in/weekly",
        description: "Get weekly check-in",
        authentication: "required",
        roles: ["client", "coach"],
        queryParams: [
          { name: "weekStart", type: "string (YYYY-MM-DD)", required: false, description: "Week start date" },
        ],
        response: [
          { status: 200, description: "Weekly check-in data" },
          { status: 404, description: "No check-in for week" },
        ],
      },
      {
        method: "POST",
        path: "/api/check-in/weekly",
        description: "Submit weekly check-in",
        authentication: "required",
        roles: ["client"],
        requestBody: {
          contentType: "application/json",
          schema: "weeklyCheckinSchema",
        },
        response: [
          { status: 201, description: "Weekly check-in created" },
          { status: 400, description: "Validation error" },
        ],
      },
      {
        method: "GET",
        path: "/api/check-in/history",
        description: "Get check-in history with pagination",
        authentication: "required",
        queryParams: [
          { name: "type", type: "daily | weekly", required: false, description: "Check-in type" },
          { name: "startDate", type: "string", required: false, description: "Start date" },
          { name: "endDate", type: "string", required: false, description: "End date" },
          { name: "page", type: "number", required: false, description: "Page number" },
          { name: "limit", type: "number", required: false, description: "Items per page" },
        ],
        response: [
          { status: 200, description: "Paginated check-in history" },
        ],
      },
    ],
  },

  // ============================================
  // Progress
  // ============================================
  {
    name: "Progress",
    basePath: "/api/progress",
    description: "Progress tracking (photos, measurements, blood reports)",
    endpoints: [
      {
        method: "GET",
        path: "/api/progress/photos",
        description: "Get progress photos with optional comparison",
        authentication: "required",
        roles: ["client", "coach"],
        rateLimit: "20 requests per minute (sensitive data)",
        queryParams: [
          { name: "angle", type: "front | side | back", required: false, description: "Photo angle" },
          { name: "startDate", type: "string", required: false, description: "Filter start" },
          { name: "endDate", type: "string", required: false, description: "Filter end" },
        ],
        response: [
          { status: 200, description: "List of progress photos" },
        ],
      },
      {
        method: "POST",
        path: "/api/progress/photos",
        description: "Upload progress photo",
        authentication: "required",
        roles: ["client"],
        rateLimit: "10 uploads per minute",
        requestBody: {
          contentType: "multipart/form-data",
          schema: "file + angle + date",
        },
        response: [
          { status: 201, description: "Photo uploaded" },
          { status: 400, description: "Invalid file or angle" },
        ],
      },
      {
        method: "GET",
        path: "/api/progress/measurements",
        description: "Get measurement history",
        authentication: "required",
        response: [
          { status: 200, description: "Measurement records" },
        ],
      },
      {
        method: "GET",
        path: "/api/progress/blood-reports",
        description: "Get blood report history",
        authentication: "required",
        rateLimit: "20 requests per minute (sensitive data)",
        response: [
          { status: 200, description: "Blood report records (decrypted)" },
        ],
      },
      {
        method: "POST",
        path: "/api/progress/blood-reports",
        description: "Add blood report values",
        authentication: "required",
        roles: ["client"],
        requestBody: {
          contentType: "application/json",
          schema: "bloodReportSchema",
        },
        response: [
          { status: 201, description: "Blood report saved (encrypted)" },
          { status: 400, description: "Validation error" },
        ],
      },
    ],
  },

  // ============================================
  // Plans
  // ============================================
  {
    name: "Plans",
    basePath: "/api/plans",
    description: "Nutrition and training plan management",
    endpoints: [
      {
        method: "GET",
        path: "/api/plans",
        description: "Get current assigned plans",
        authentication: "required",
        response: [
          { status: 200, description: "Current nutrition and training plans" },
        ],
      },
      {
        method: "GET",
        path: "/api/plans/[planId]",
        description: "Get specific plan details",
        authentication: "required",
        response: [
          { status: 200, description: "Plan details with items" },
          { status: 404, description: "Plan not found" },
        ],
      },
      {
        method: "POST",
        path: "/api/plans",
        description: "Create new plan (coach only)",
        authentication: "required",
        roles: ["coach", "admin"],
        requestBody: {
          contentType: "application/json",
          schema: "nutritionPlanSchema | trainingPlanSchema",
        },
        response: [
          { status: 201, description: "Plan created" },
          { status: 400, description: "Validation error" },
        ],
      },
      {
        method: "POST",
        path: "/api/plans/[planId]/assign",
        description: "Assign plan to client (coach only)",
        authentication: "required",
        roles: ["coach", "admin"],
        requestBody: {
          contentType: "application/json",
          schema: "{ clientId: uuid, startDate: date }",
        },
        response: [
          { status: 200, description: "Plan assigned" },
          { status: 404, description: "Plan or client not found" },
        ],
      },
      {
        method: "POST",
        path: "/api/plans/pdf",
        description: "Generate PDF export of plan",
        authentication: "required",
        requestBody: {
          contentType: "application/json",
          schema: "{ planId: uuid, type: 'nutrition' | 'training' }",
        },
        response: [
          { status: 200, description: "PDF file download" },
        ],
      },
    ],
  },

  // ============================================
  // Messaging
  // ============================================
  {
    name: "Messaging",
    basePath: "/api/messages",
    description: "Real-time messaging between coach and client",
    endpoints: [
      {
        method: "GET",
        path: "/api/messages",
        description: "Get conversation list",
        authentication: "required",
        response: [
          { status: 200, description: "List of conversations with last message" },
        ],
      },
      {
        method: "GET",
        path: "/api/messages/[conversationId]",
        description: "Get messages in conversation",
        authentication: "required",
        queryParams: [
          { name: "before", type: "string (cursor)", required: false, description: "Pagination cursor" },
          { name: "limit", type: "number", required: false, description: "Messages per page" },
        ],
        response: [
          { status: 200, description: "Paginated messages" },
          { status: 404, description: "Conversation not found" },
        ],
      },
      {
        method: "POST",
        path: "/api/messages/[conversationId]",
        description: "Send message",
        authentication: "required",
        requestBody: {
          contentType: "application/json",
          schema: "messageSchema",
        },
        response: [
          { status: 201, description: "Message sent" },
          { status: 400, description: "Validation error" },
        ],
      },
      {
        method: "PUT",
        path: "/api/messages/[messageId]/read",
        description: "Mark message as read",
        authentication: "required",
        response: [
          { status: 200, description: "Message marked as read" },
        ],
      },
    ],
  },

  // ============================================
  // Notifications
  // ============================================
  {
    name: "Notifications",
    basePath: "/api/notifications",
    description: "Push notification management",
    endpoints: [
      {
        method: "POST",
        path: "/api/notifications/subscribe",
        description: "Subscribe to push notifications",
        authentication: "required",
        requestBody: {
          contentType: "application/json",
          schema: "notificationSubscriptionSchema",
        },
        response: [
          { status: 200, description: "Subscription saved" },
        ],
      },
      {
        method: "DELETE",
        path: "/api/notifications/subscribe",
        description: "Unsubscribe from push notifications",
        authentication: "required",
        response: [
          { status: 200, description: "Subscription removed" },
        ],
      },
      {
        method: "POST",
        path: "/api/notifications/send",
        description: "Send push notification (coach only)",
        authentication: "required",
        roles: ["coach", "admin"],
        requestBody: {
          contentType: "application/json",
          schema: "sendNotificationSchema",
        },
        response: [
          { status: 200, description: "Notification sent", example: { sent: 1, failed: 0 } },
        ],
      },
    ],
  },

  // ============================================
  // Admin
  // ============================================
  {
    name: "Admin",
    basePath: "/api/admin",
    description: "Coach/admin management endpoints",
    endpoints: [
      {
        method: "GET",
        path: "/api/admin/clients",
        description: "Get client list with filters",
        authentication: "required",
        roles: ["coach", "admin"],
        queryParams: [
          { name: "status", type: "active | inactive | all", required: false, description: "Filter by status" },
          { name: "search", type: "string", required: false, description: "Search by name/email" },
          { name: "page", type: "number", required: false, description: "Page number" },
          { name: "limit", type: "number", required: false, description: "Items per page" },
        ],
        response: [
          { status: 200, description: "Paginated client list" },
        ],
      },
      {
        method: "GET",
        path: "/api/admin/clients/[clientId]",
        description: "Get detailed client information",
        authentication: "required",
        roles: ["coach", "admin"],
        response: [
          { status: 200, description: "Client details with assessment, plans, progress" },
          { status: 404, description: "Client not found" },
        ],
      },
      {
        method: "POST",
        path: "/api/admin/clients/invite",
        description: "Invite new client",
        authentication: "required",
        roles: ["coach", "admin"],
        requestBody: {
          contentType: "application/json",
          schema: "{ email, firstName, lastName, planId? }",
        },
        response: [
          { status: 201, description: "Invitation sent" },
          { status: 400, description: "Email already registered" },
        ],
      },
      {
        method: "GET",
        path: "/api/admin/risk-flags",
        description: "Get active risk flags",
        authentication: "required",
        roles: ["coach", "admin"],
        queryParams: [
          { name: "severity", type: "low | medium | high | critical", required: false, description: "Filter by severity" },
          { name: "acknowledged", type: "boolean", required: false, description: "Filter by acknowledgment" },
        ],
        response: [
          { status: 200, description: "List of risk flags" },
        ],
      },
      {
        method: "POST",
        path: "/api/admin/risk-flags/[flagId]/acknowledge",
        description: "Acknowledge risk flag",
        authentication: "required",
        roles: ["coach", "admin"],
        requestBody: {
          contentType: "application/json",
          schema: "{ notes?: string }",
        },
        response: [
          { status: 200, description: "Flag acknowledged" },
        ],
      },
      {
        method: "GET",
        path: "/api/admin/analytics",
        description: "Get dashboard analytics",
        authentication: "required",
        roles: ["coach", "admin"],
        response: [
          {
            status: 200,
            description: "Analytics data",
            example: {
              totalClients: 50,
              activeClients: 45,
              compliance: 0.85,
              revenue: { current: 500000, previous: 450000 },
            },
          },
        ],
      },
    ],
  },

  // ============================================
  // Subscriptions
  // ============================================
  {
    name: "Subscriptions",
    basePath: "/api/subscriptions",
    description: "Subscription and payment management",
    endpoints: [
      {
        method: "GET",
        path: "/api/subscriptions",
        description: "Get subscription details",
        authentication: "required",
        response: [
          { status: 200, description: "Current subscription with payment history" },
        ],
      },
      {
        method: "GET",
        path: "/api/subscriptions/admin",
        description: "Get all subscriptions (coach only)",
        authentication: "required",
        roles: ["coach", "admin"],
        queryParams: [
          { name: "status", type: "active | expiring | expired", required: false, description: "Filter" },
        ],
        response: [
          { status: 200, description: "List of subscriptions" },
        ],
      },
      {
        method: "PUT",
        path: "/api/subscriptions/[subscriptionId]/payment",
        description: "Update payment status (coach only)",
        authentication: "required",
        roles: ["coach", "admin"],
        requestBody: {
          contentType: "application/json",
          schema: "paymentUpdateSchema",
        },
        response: [
          { status: 200, description: "Payment status updated" },
        ],
      },
    ],
  },

  // ============================================
  // Storage
  // ============================================
  {
    name: "Storage",
    basePath: "/api/storage",
    description: "File upload and download management",
    endpoints: [
      {
        method: "POST",
        path: "/api/storage/upload",
        description: "Get signed upload URL",
        authentication: "required",
        rateLimit: "10 uploads per minute",
        requestBody: {
          contentType: "application/json",
          schema: "{ bucket: string, fileName: string, contentType: string }",
        },
        response: [
          { status: 200, description: "Signed upload URL" },
        ],
      },
      {
        method: "POST",
        path: "/api/storage/signed-url",
        description: "Get signed download URL",
        authentication: "required",
        requestBody: {
          contentType: "application/json",
          schema: "{ bucket: string, path: string }",
        },
        response: [
          { status: 200, description: "Signed download URL" },
        ],
      },
    ],
  },

  // ============================================
  // Compliance
  // ============================================
  {
    name: "Compliance",
    basePath: "/api/compliance",
    description: "DPDP compliance and data management",
    endpoints: [
      {
        method: "GET",
        path: "/api/compliance/consents",
        description: "Get user consent status",
        authentication: "required",
        response: [
          { status: 200, description: "Consent records" },
        ],
      },
      {
        method: "POST",
        path: "/api/compliance/consents",
        description: "Update consent",
        authentication: "required",
        requestBody: {
          contentType: "application/json",
          schema: "{ consentType: string, granted: boolean }",
        },
        response: [
          { status: 200, description: "Consent updated" },
        ],
      },
      {
        method: "POST",
        path: "/api/compliance/data-export",
        description: "Request data export (DPDP right to portability)",
        authentication: "required",
        response: [
          { status: 202, description: "Export request accepted" },
        ],
      },
      {
        method: "POST",
        path: "/api/compliance/data-deletion",
        description: "Request data deletion (DPDP right to erasure)",
        authentication: "required",
        requestBody: {
          contentType: "application/json",
          schema: "{ categories: DataCategory[], reason?: string }",
        },
        response: [
          { status: 202, description: "Deletion request submitted" },
        ],
      },
    ],
  },
];

/**
 * Get endpoint by path and method
 */
export function getEndpoint(path: string, method: string): APIEndpoint | undefined {
  for (const group of API_DOCUMENTATION) {
    const endpoint = group.endpoints.find(
      (e) => e.path === path && e.method === method
    );
    if (endpoint) return endpoint;
  }
  return undefined;
}

/**
 * Get all endpoints for a group
 */
export function getGroupEndpoints(groupName: string): APIEndpoint[] {
  const group = API_DOCUMENTATION.find((g) => g.name === groupName);
  return group?.endpoints || [];
}

/**
 * Get endpoints requiring specific role
 */
export function getEndpointsByRole(role: "client" | "coach" | "admin"): APIEndpoint[] {
  const endpoints: APIEndpoint[] = [];
  for (const group of API_DOCUMENTATION) {
    for (const endpoint of group.endpoints) {
      if (!endpoint.roles || endpoint.roles.includes(role)) {
        endpoints.push(endpoint);
      }
    }
  }
  return endpoints;
}
