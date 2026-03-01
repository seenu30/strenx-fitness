/**
 * User roles in the system
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  COACH: 'coach',
  CLIENT: 'client',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Role display names
 */
export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.COACH]: 'Coach',
  [ROLES.CLIENT]: 'Client',
};

/**
 * Role descriptions
 */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: 'Full system access, manage coaches and settings',
  [ROLES.COACH]: 'Manage clients, create plans, track progress',
  [ROLES.CLIENT]: 'Access personal dashboard, track progress, communicate with coach',
};
