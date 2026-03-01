/**
 * Supabase Database Types
 *
 * This file will be auto-generated from your Supabase schema using:
 * npx supabase gen types typescript --project-id your-project-id > src/types/database.ts
 *
 * For now, this is a placeholder with the expected structure.
 * Run the generation command after setting up your Supabase project and applying migrations.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'super_admin' | 'coach' | 'client'
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional'
export type DietPreference = 'vegetarian' | 'eggetarian' | 'non_vegetarian' | 'vegan'
export type FrequencyType = 'never' | 'rarely' | 'occasionally' | 'frequently' | 'daily'
export type QualityRating = 'poor' | 'fair' | 'good' | 'excellent'
export type StressLevel = 'low' | 'moderate' | 'high' | 'very_high'
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'unpaid' | 'paused'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type MessageStatus = 'sent' | 'delivered' | 'read'
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ConsentType = 'data_processing' | 'marketing' | 'medical_data_sharing' | 'photo_usage' | 'terms_of_service'
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'login' | 'logout'

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          settings: Json
          subscription_tier: string
          max_coaches: number
          max_clients: number
          data_retention_days: number
          require_mfa: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          settings?: Json
          subscription_tier?: string
          max_coaches?: number
          max_clients?: number
          data_retention_days?: number
          require_mfa?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          settings?: Json
          subscription_tier?: string
          max_coaches?: number
          max_clients?: number
          data_retention_days?: number
          require_mfa?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          role: UserRole
          email: string
          phone: string | null
          first_name: string
          last_name: string
          display_name: string | null
          avatar_url: string | null
          date_of_birth: string | null
          age_verified: boolean
          age_verified_at: string | null
          mfa_enabled: boolean
          mfa_method: string | null
          is_active: boolean
          email_verified: boolean
          phone_verified: boolean
          timezone: string
          locale: string
          preferences: Json
          created_at: string
          updated_at: string
          last_login_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id: string
          tenant_id: string
          role?: UserRole
          email: string
          phone?: string | null
          first_name: string
          last_name: string
          display_name?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          age_verified?: boolean
          age_verified_at?: string | null
          mfa_enabled?: boolean
          mfa_method?: string | null
          is_active?: boolean
          email_verified?: boolean
          phone_verified?: boolean
          timezone?: string
          locale?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          role?: UserRole
          email?: string
          phone?: string | null
          first_name?: string
          last_name?: string
          display_name?: string | null
          avatar_url?: string | null
          date_of_birth?: string | null
          age_verified?: boolean
          age_verified_at?: string | null
          mfa_enabled?: boolean
          mfa_method?: string | null
          is_active?: boolean
          email_verified?: boolean
          phone_verified?: boolean
          timezone?: string
          locale?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          deleted_at?: string | null
        }
      }
      coaches: {
        Row: {
          id: string
          user_id: string
          tenant_id: string
          specializations: string[] | null
          certifications: Json
          bio: string | null
          experience_years: number | null
          max_active_clients: number
          accepting_clients: boolean
          working_hours: Json
          notification_preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tenant_id: string
          specializations?: string[] | null
          certifications?: Json
          bio?: string | null
          experience_years?: number | null
          max_active_clients?: number
          accepting_clients?: boolean
          working_hours?: Json
          notification_preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tenant_id?: string
          specializations?: string[] | null
          certifications?: Json
          bio?: string | null
          experience_years?: number | null
          max_active_clients?: number
          accepting_clients?: boolean
          working_hours?: Json
          notification_preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          tenant_id: string
          coach_id: string | null
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          current_weight_kg: number | null
          target_weight_kg: number | null
          height_cm: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tenant_id: string
          coach_id?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          current_weight_kg?: number | null
          target_weight_kg?: number | null
          height_cm?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tenant_id?: string
          coach_id?: string | null
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          current_weight_kg?: number | null
          target_weight_kg?: number | null
          height_cm?: number | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      // Additional tables will be auto-generated
      // This is a placeholder showing the structure
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_tenant_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<string, never>
        Returns: UserRole
      }
      is_coach: {
        Args: Record<string, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
      gender_type: Gender
      experience_level: ExperienceLevel
      diet_preference: DietPreference
      frequency_type: FrequencyType
      quality_rating: QualityRating
      stress_level: StressLevel
      activity_level: ActivityLevel
      subscription_status: SubscriptionStatus
      payment_status: PaymentStatus
      message_status: MessageStatus
      risk_severity: RiskSeverity
      consent_type: ConsentType
      audit_action: AuditAction
    }
  }
}

// Helper types for table rows
export type Tenant = Database['public']['Tables']['tenants']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Coach = Database['public']['Tables']['coaches']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
