export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          accessed_at: string
          action: Database["public"]["Enums"]["audit_action"]
          client_id: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          accessed_at?: string
          action: Database["public"]["Enums"]["audit_action"]
          client_id?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id: string
          user_role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          accessed_at?: string
          action?: Database["public"]["Enums"]["audit_action"]
          client_id?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string
          user_role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      assess_blood_reports: {
        Row: {
          abnormal_parameters: string[] | null
          assessment_id: string
          created_at: string | null
          encryption_key_id: string
          has_abnormal_values: boolean | null
          has_report: boolean | null
          id: string
          lab_name: string | null
          report_date: string
          report_file_path: string | null
          report_values_encrypted: string
          updated_at: string | null
        }
        Insert: {
          abnormal_parameters?: string[] | null
          assessment_id: string
          created_at?: string | null
          encryption_key_id?: string
          has_abnormal_values?: boolean | null
          has_report?: boolean | null
          id?: string
          lab_name?: string | null
          report_date: string
          report_file_path?: string | null
          report_values_encrypted: string
          updated_at?: string | null
        }
        Update: {
          abnormal_parameters?: string[] | null
          assessment_id?: string
          created_at?: string | null
          encryption_key_id?: string
          has_abnormal_values?: boolean | null
          has_report?: boolean | null
          id?: string
          lab_name?: string | null
          report_date?: string
          report_file_path?: string | null
          report_values_encrypted?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assess_blood_reports_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "client_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assess_diet: {
        Row: {
          alcohol_frequency:
            | Database["public"]["Enums"]["frequency_type"]
            | null
          alcohol_types: string[] | null
          assessment_id: string
          caffeine_cups_per_day: number | null
          cigarettes_per_day: number | null
          common_outside_food: string[] | null
          created_at: string | null
          diet_preference: Database["public"]["Enums"]["diet_preference"]
          id: string
          late_night_eating: boolean | null
          meal_pattern: string | null
          meals_per_day: number | null
          other_beverages: string[] | null
          outside_food_frequency:
            | Database["public"]["Enums"]["frequency_type"]
            | null
          smoking_status: string | null
          snacks_per_day: number | null
          typical_eating_window_end: string | null
          typical_eating_window_start: string | null
          updated_at: string | null
          water_intake_liters: number | null
        }
        Insert: {
          alcohol_frequency?:
            | Database["public"]["Enums"]["frequency_type"]
            | null
          alcohol_types?: string[] | null
          assessment_id: string
          caffeine_cups_per_day?: number | null
          cigarettes_per_day?: number | null
          common_outside_food?: string[] | null
          created_at?: string | null
          diet_preference: Database["public"]["Enums"]["diet_preference"]
          id?: string
          late_night_eating?: boolean | null
          meal_pattern?: string | null
          meals_per_day?: number | null
          other_beverages?: string[] | null
          outside_food_frequency?:
            | Database["public"]["Enums"]["frequency_type"]
            | null
          smoking_status?: string | null
          snacks_per_day?: number | null
          typical_eating_window_end?: string | null
          typical_eating_window_start?: string | null
          updated_at?: string | null
          water_intake_liters?: number | null
        }
        Update: {
          alcohol_frequency?:
            | Database["public"]["Enums"]["frequency_type"]
            | null
          alcohol_types?: string[] | null
          assessment_id?: string
          caffeine_cups_per_day?: number | null
          cigarettes_per_day?: number | null
          common_outside_food?: string[] | null
          created_at?: string | null
          diet_preference?: Database["public"]["Enums"]["diet_preference"]
          id?: string
          late_night_eating?: boolean | null
          meal_pattern?: string | null
          meals_per_day?: number | null
          other_beverages?: string[] | null
          outside_food_frequency?:
            | Database["public"]["Enums"]["frequency_type"]
            | null
          smoking_status?: string | null
          snacks_per_day?: number | null
          typical_eating_window_end?: string | null
          typical_eating_window_start?: string | null
          updated_at?: string | null
          water_intake_liters?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assess_diet_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "client_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assess_expectations: {
        Row: {
          additional_notes: string | null
          assessment_id: string
          created_at: string | null
          expectations: string | null
          id: string
          open_to_daily_checkins: boolean | null
          open_to_food_tracking: boolean | null
          open_to_measurements: boolean | null
          open_to_progress_photos: boolean | null
          past_challenges: string | null
          preferred_check_in_time: string | null
          preferred_response_time: string | null
          realistic_timeline_understood: boolean | null
          reasons_for_past_failures: string[] | null
          updated_at: string | null
        }
        Insert: {
          additional_notes?: string | null
          assessment_id: string
          created_at?: string | null
          expectations?: string | null
          id?: string
          open_to_daily_checkins?: boolean | null
          open_to_food_tracking?: boolean | null
          open_to_measurements?: boolean | null
          open_to_progress_photos?: boolean | null
          past_challenges?: string | null
          preferred_check_in_time?: string | null
          preferred_response_time?: string | null
          realistic_timeline_understood?: boolean | null
          reasons_for_past_failures?: string[] | null
          updated_at?: string | null
        }
        Update: {
          additional_notes?: string | null
          assessment_id?: string
          created_at?: string | null
          expectations?: string | null
          id?: string
          open_to_daily_checkins?: boolean | null
          open_to_food_tracking?: boolean | null
          open_to_measurements?: boolean | null
          open_to_progress_photos?: boolean | null
          past_challenges?: string | null
          preferred_check_in_time?: string | null
          preferred_response_time?: string | null
          realistic_timeline_understood?: boolean | null
          reasons_for_past_failures?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assess_expectations_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "client_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assess_food_preferences: {
        Row: {
          assessment_id: string
          cooking_ability: string | null
          created_at: string | null
          disliked_foods: string[] | null
          id: string
          liked_foods: string[] | null
          preferred_cuisines: string[] | null
          problematic_foods: Json | null
          religious_restrictions: string | null
          restrictions: string[] | null
          updated_at: string | null
        }
        Insert: {
          assessment_id: string
          cooking_ability?: string | null
          created_at?: string | null
          disliked_foods?: string[] | null
          id?: string
          liked_foods?: string[] | null
          preferred_cuisines?: string[] | null
          problematic_foods?: Json | null
          religious_restrictions?: string | null
          restrictions?: string[] | null
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string
          cooking_ability?: string | null
          created_at?: string | null
          disliked_foods?: string[] | null
          id?: string
          liked_foods?: string[] | null
          preferred_cuisines?: string[] | null
          problematic_foods?: Json | null
          religious_restrictions?: string | null
          restrictions?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assess_food_preferences_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "client_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assess_goals: {
        Row: {
          assessment_id: string
          commitment_level: number | null
          created_at: string | null
          goal_deadline: string | null
          goal_timeline: string | null
          id: string
          motivation: string | null
          primary_goals: string[]
          secondary_goals: string[] | null
          specific_targets: Json | null
          updated_at: string | null
          weekly_hours_available: number | null
        }
        Insert: {
          assessment_id: string
          commitment_level?: number | null
          created_at?: string | null
          goal_deadline?: string | null
          goal_timeline?: string | null
          id?: string
          motivation?: string | null
          primary_goals: string[]
          secondary_goals?: string[] | null
          specific_targets?: Json | null
          updated_at?: string | null
          weekly_hours_available?: number | null
        }
        Update: {
          assessment_id?: string
          commitment_level?: number | null
          created_at?: string | null
          goal_deadline?: string | null
          goal_timeline?: string | null
          id?: string
          motivation?: string | null
          primary_goals?: string[]
          secondary_goals?: string[] | null
          specific_targets?: Json | null
          updated_at?: string | null
          weekly_hours_available?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assess_goals_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "client_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assess_lifestyle: {
        Row: {
          assessment_id: string
          created_at: string | null
          daily_activity_level:
            | Database["public"]["Enums"]["activity_level"]
            | null
          daily_steps_estimate: number | null
          id: string
          screen_time_hours: number | null
          sedentary_hours_per_day: number | null
          sleep_duration_hours: number | null
          sleep_issues: string[] | null
          sleep_quality: Database["public"]["Enums"]["quality_rating"] | null
          stress_level: number | null
          stress_management: string[] | null
          stress_triggers: string[] | null
          typical_sleep_time: string | null
          typical_wake_time: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          daily_activity_level?:
            | Database["public"]["Enums"]["activity_level"]
            | null
          daily_steps_estimate?: number | null
          id?: string
          screen_time_hours?: number | null
          sedentary_hours_per_day?: number | null
          sleep_duration_hours?: number | null
          sleep_issues?: string[] | null
          sleep_quality?: Database["public"]["Enums"]["quality_rating"] | null
          stress_level?: number | null
          stress_management?: string[] | null
          stress_triggers?: string[] | null
          typical_sleep_time?: string | null
          typical_wake_time?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          daily_activity_level?:
            | Database["public"]["Enums"]["activity_level"]
            | null
          daily_steps_estimate?: number | null
          id?: string
          screen_time_hours?: number | null
          sedentary_hours_per_day?: number | null
          sleep_duration_hours?: number | null
          sleep_issues?: string[] | null
          sleep_quality?: Database["public"]["Enums"]["quality_rating"] | null
          stress_level?: number | null
          stress_management?: string[] | null
          stress_triggers?: string[] | null
          typical_sleep_time?: string | null
          typical_wake_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assess_lifestyle_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "client_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assess_medical: {
        Row: {
          allergies_encrypted: string | null
          assessment_id: string
          conditions_encrypted: string | null
          created_at: string | null
          eating_disorder_history_encrypted: string | null
          encryption_key_id: string
          has_autoimmune: boolean | null
          has_blood_pressure: boolean | null
          has_cholesterol: boolean | null
          has_diabetes: boolean | null
          has_eating_disorder_history: boolean | null
          has_gut_issues: boolean | null
          has_hormonal_issues: boolean | null
          has_pcos: boolean | null
          has_thyroid_condition: boolean | null
          id: string
          medications_encrypted: string | null
          surgeries_encrypted: string | null
          updated_at: string | null
        }
        Insert: {
          allergies_encrypted?: string | null
          assessment_id: string
          conditions_encrypted?: string | null
          created_at?: string | null
          eating_disorder_history_encrypted?: string | null
          encryption_key_id?: string
          has_autoimmune?: boolean | null
          has_blood_pressure?: boolean | null
          has_cholesterol?: boolean | null
          has_diabetes?: boolean | null
          has_eating_disorder_history?: boolean | null
          has_gut_issues?: boolean | null
          has_hormonal_issues?: boolean | null
          has_pcos?: boolean | null
          has_thyroid_condition?: boolean | null
          id?: string
          medications_encrypted?: string | null
          surgeries_encrypted?: string | null
          updated_at?: string | null
        }
        Update: {
          allergies_encrypted?: string | null
          assessment_id?: string
          conditions_encrypted?: string | null
          created_at?: string | null
          eating_disorder_history_encrypted?: string | null
          encryption_key_id?: string
          has_autoimmune?: boolean | null
          has_blood_pressure?: boolean | null
          has_cholesterol?: boolean | null
          has_diabetes?: boolean | null
          has_eating_disorder_history?: boolean | null
          has_gut_issues?: boolean | null
          has_hormonal_issues?: boolean | null
          has_pcos?: boolean | null
          has_thyroid_condition?: boolean | null
          id?: string
          medications_encrypted?: string | null
          surgeries_encrypted?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assess_medical_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "client_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assess_personal: {
        Row: {
          age: number
          assessment_id: string
          bmi: number | null
          city: string | null
          created_at: string | null
          current_weight_kg: number
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          height_cm: number
          id: string
          occupation: string | null
          target_weight_kg: number | null
          timezone: string | null
          updated_at: string | null
          work_timing_end: string | null
          work_timing_start: string | null
          work_type: string | null
        }
        Insert: {
          age: number
          assessment_id: string
          bmi?: number | null
          city?: string | null
          created_at?: string | null
          current_weight_kg: number
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          height_cm: number
          id?: string
          occupation?: string | null
          target_weight_kg?: number | null
          timezone?: string | null
          updated_at?: string | null
          work_timing_end?: string | null
          work_timing_start?: string | null
          work_type?: string | null
        }
        Update: {
          age?: number
          assessment_id?: string
          bmi?: number | null
          city?: string | null
          created_at?: string | null
          current_weight_kg?: number
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          height_cm?: number
          id?: string
          occupation?: string | null
          target_weight_kg?: number | null
          timezone?: string | null
          updated_at?: string | null
          work_timing_end?: string | null
          work_timing_start?: string | null
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assess_personal_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "client_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assess_skin_hair: {
        Row: {
          assessment_id: string
          created_at: string | null
          hair_concerns: string[] | null
          hair_type: string | null
          id: string
          recovery_concerns: string[] | null
          skin_concerns: string[] | null
          skin_type: string | null
          typical_recovery_time: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          hair_concerns?: string[] | null
          hair_type?: string | null
          id?: string
          recovery_concerns?: string[] | null
          skin_concerns?: string[] | null
          skin_type?: string | null
          typical_recovery_time?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          hair_concerns?: string[] | null
          hair_type?: string | null
          id?: string
          recovery_concerns?: string[] | null
          skin_concerns?: string[] | null
          skin_type?: string | null
          typical_recovery_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assess_skin_hair_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "client_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assess_supplements: {
        Row: {
          assessment_id: string
          created_at: string | null
          current_supplements: Json | null
          id: string
          open_to_supplements: boolean | null
          past_supplements: Json | null
          supplement_budget_inr: number | null
          updated_at: string | null
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          current_supplements?: Json | null
          id?: string
          open_to_supplements?: boolean | null
          past_supplements?: Json | null
          supplement_budget_inr?: number | null
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          current_supplements?: Json | null
          id?: string
          open_to_supplements?: boolean | null
          past_supplements?: Json | null
          supplement_budget_inr?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assess_supplements_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "client_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assess_training: {
        Row: {
          assessment_id: string
          created_at: string | null
          current_frequency_per_week: number | null
          current_limitations: string[] | null
          current_session_duration_mins: number | null
          current_training_styles: string[] | null
          equipment_available: string[] | null
          experience_level: Database["public"]["Enums"]["experience_level"]
          id: string
          past_injuries: Json | null
          preferred_training_location: string | null
          preferred_training_time: string | null
          training_experience_months: number | null
          updated_at: string | null
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          current_frequency_per_week?: number | null
          current_limitations?: string[] | null
          current_session_duration_mins?: number | null
          current_training_styles?: string[] | null
          equipment_available?: string[] | null
          experience_level: Database["public"]["Enums"]["experience_level"]
          id?: string
          past_injuries?: Json | null
          preferred_training_location?: string | null
          preferred_training_time?: string | null
          training_experience_months?: number | null
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          current_frequency_per_week?: number | null
          current_limitations?: string[] | null
          current_session_duration_mins?: number | null
          current_training_styles?: string[] | null
          equipment_available?: string[] | null
          experience_level?: Database["public"]["Enums"]["experience_level"]
          id?: string
          past_injuries?: Json | null
          preferred_training_location?: string | null
          preferred_training_time?: string | null
          training_experience_months?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assess_training_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "client_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_history: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          changed_at: string
          changed_by: string
          changed_by_role: Database["public"]["Enums"]["user_role"] | null
          changed_fields: string[] | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          changed_at?: string
          changed_by: string
          changed_by_role?: Database["public"]["Enums"]["user_role"] | null
          changed_fields?: string[] | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          changed_at?: string
          changed_by?: string
          changed_by_role?: Database["public"]["Enums"]["user_role"] | null
          changed_fields?: string[] | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      blood_report_logs: {
        Row: {
          abnormal_markers: string[] | null
          client_id: string
          coach_notes: string | null
          created_at: string | null
          encryption_key_id: string
          has_abnormal_values: boolean | null
          id: string
          lab_name: string | null
          notes: string | null
          report_date: string
          report_file_path: string | null
          values_encrypted: string
        }
        Insert: {
          abnormal_markers?: string[] | null
          client_id: string
          coach_notes?: string | null
          created_at?: string | null
          encryption_key_id?: string
          has_abnormal_values?: boolean | null
          id?: string
          lab_name?: string | null
          notes?: string | null
          report_date: string
          report_file_path?: string | null
          values_encrypted: string
        }
        Update: {
          abnormal_markers?: string[] | null
          client_id?: string
          coach_notes?: string | null
          created_at?: string | null
          encryption_key_id?: string
          has_abnormal_values?: boolean | null
          id?: string
          lab_name?: string | null
          notes?: string | null
          report_date?: string
          report_file_path?: string | null
          values_encrypted?: string
        }
        Relationships: [
          {
            foreignKeyName: "blood_report_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_meals: {
        Row: {
          checkin_id: string
          created_at: string | null
          deviation_notes: string | null
          followed_plan: boolean | null
          id: string
          meal_name: string | null
          meal_number: number
          photo_path: string | null
          photo_url: string | null
        }
        Insert: {
          checkin_id: string
          created_at?: string | null
          deviation_notes?: string | null
          followed_plan?: boolean | null
          id?: string
          meal_name?: string | null
          meal_number: number
          photo_path?: string | null
          photo_url?: string | null
        }
        Update: {
          checkin_id?: string
          created_at?: string | null
          deviation_notes?: string | null
          followed_plan?: boolean | null
          id?: string
          meal_name?: string | null
          meal_number?: number
          photo_path?: string | null
          photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkin_meals_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "daily_checkins"
            referencedColumns: ["id"]
          },
        ]
      }
      checkin_training: {
        Row: {
          checkin_id: string
          created_at: string | null
          exercise_logs: Json | null
          id: string
          performance_notes: string | null
          workout_duration_minutes: number | null
        }
        Insert: {
          checkin_id: string
          created_at?: string | null
          exercise_logs?: Json | null
          id?: string
          performance_notes?: string | null
          workout_duration_minutes?: number | null
        }
        Update: {
          checkin_id?: string
          created_at?: string | null
          exercise_logs?: Json | null
          id?: string
          performance_notes?: string | null
          workout_duration_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "checkin_training_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "daily_checkins"
            referencedColumns: ["id"]
          },
        ]
      }
      client_assessments: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          is_current: boolean | null
          sections_completed: string[] | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          sections_completed?: string[] | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          sections_completed?: string[] | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_assessments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_plan_assignments: {
        Row: {
          assigned_by: string
          assignment_notes: string | null
          client_id: string
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          nutrition_plan_version_id: string | null
          start_date: string
          training_plan_version_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_by: string
          assignment_notes?: string | null
          client_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          nutrition_plan_version_id?: string | null
          start_date: string
          training_plan_version_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string
          assignment_notes?: string | null
          client_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          nutrition_plan_version_id?: string | null
          start_date?: string
          training_plan_version_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_plan_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_plan_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_plan_assignments_nutrition_plan_version_id_fkey"
            columns: ["nutrition_plan_version_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plan_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_plan_assignments_training_plan_version_id_fkey"
            columns: ["training_plan_version_id"]
            isOneToOne: false
            referencedRelation: "training_plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          coach_id: string | null
          created_at: string | null
          current_weight_kg: number | null
          height_cm: number | null
          id: string
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          status: string | null
          target_weight_kg: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          coach_id?: string | null
          created_at?: string | null
          current_weight_kg?: number | null
          height_cm?: number | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          status?: string | null
          target_weight_kg?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          coach_id?: string | null
          created_at?: string | null
          current_weight_kg?: number | null
          height_cm?: number | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          status?: string | null
          target_weight_kg?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_client_history: {
        Row: {
          assigned_at: string | null
          client_id: string
          coach_id: string
          id: string
          reason: string | null
          unassigned_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          client_id: string
          coach_id: string
          id?: string
          reason?: string | null
          unassigned_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          client_id?: string
          coach_id?: string
          id?: string
          reason?: string | null
          unassigned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_client_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_client_history_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          accepting_clients: boolean | null
          bio: string | null
          certifications: Json | null
          created_at: string | null
          experience_years: number | null
          id: string
          max_active_clients: number | null
          notification_preferences: Json | null
          specializations: string[] | null
          updated_at: string | null
          user_id: string
          working_hours: Json | null
        }
        Insert: {
          accepting_clients?: boolean | null
          bio?: string | null
          certifications?: Json | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          max_active_clients?: number | null
          notification_preferences?: Json | null
          specializations?: string[] | null
          updated_at?: string | null
          user_id: string
          working_hours?: Json | null
        }
        Update: {
          accepting_clients?: boolean | null
          bio?: string | null
          certifications?: Json | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          max_active_clients?: number | null
          notification_preferences?: Json | null
          specializations?: string[] | null
          updated_at?: string | null
          user_id?: string
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "coaches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          consent_text_hash: string | null
          consent_type: Database["public"]["Enums"]["consent_type"]
          consented: boolean
          consented_at: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          terms_version: string
          user_agent: string | null
          user_id: string
          withdrawn_at: string | null
        }
        Insert: {
          consent_text_hash?: string | null
          consent_type: Database["public"]["Enums"]["consent_type"]
          consented: boolean
          consented_at?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          terms_version: string
          user_agent?: string | null
          user_id: string
          withdrawn_at?: string | null
        }
        Update: {
          consent_text_hash?: string | null
          consent_type?: Database["public"]["Enums"]["consent_type"]
          consented?: boolean
          consented_at?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          terms_version?: string
          user_agent?: string | null
          user_id?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          client_id: string
          coach_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_message_at: string | null
          last_message_preview: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          coach_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          last_message_preview?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          coach_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          last_message_preview?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_checkins: {
        Row: {
          checkin_date: string
          client_id: string
          client_notes: string | null
          coach_notes: string | null
          coach_reviewed: boolean | null
          coach_reviewed_at: string | null
          created_at: string | null
          energy_level: number | null
          id: string
          mood: string | null
          morning_weight_kg: number | null
          reviewed_by: string | null
          sleep_hours: number | null
          sleep_quality: Database["public"]["Enums"]["quality_rating"] | null
          step_count: number | null
          stress_level: number | null
          training_completed: boolean | null
          training_day_id: string | null
          updated_at: string | null
        }
        Insert: {
          checkin_date: string
          client_id: string
          client_notes?: string | null
          coach_notes?: string | null
          coach_reviewed?: boolean | null
          coach_reviewed_at?: string | null
          created_at?: string | null
          energy_level?: number | null
          id?: string
          mood?: string | null
          morning_weight_kg?: number | null
          reviewed_by?: string | null
          sleep_hours?: number | null
          sleep_quality?: Database["public"]["Enums"]["quality_rating"] | null
          step_count?: number | null
          stress_level?: number | null
          training_completed?: boolean | null
          training_day_id?: string | null
          updated_at?: string | null
        }
        Update: {
          checkin_date?: string
          client_id?: string
          client_notes?: string | null
          coach_notes?: string | null
          coach_reviewed?: boolean | null
          coach_reviewed_at?: string | null
          created_at?: string | null
          energy_level?: number | null
          id?: string
          mood?: string | null
          morning_weight_kg?: number | null
          reviewed_by?: string | null
          sleep_hours?: number | null
          sleep_quality?: Database["public"]["Enums"]["quality_rating"] | null
          step_count?: number | null
          stress_level?: number | null
          training_completed?: boolean | null
          training_day_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_checkins_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_checkins_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_checkins_training_day_id_fkey"
            columns: ["training_day_id"]
            isOneToOne: false
            referencedRelation: "training_days"
            referencedColumns: ["id"]
          },
        ]
      }
      data_deletion_requests: {
        Row: {
          completion_notes: string | null
          created_at: string | null
          deadline_at: string | null
          export_expires_at: string | null
          export_url: string | null
          id: string
          legal_hold: boolean | null
          legal_hold_reason: string | null
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          request_type: string
          requested_by_email: string
          status: string | null
          updated_at: string | null
          user_id: string
          verification_code: string | null
          verified_at: string | null
        }
        Insert: {
          completion_notes?: string | null
          created_at?: string | null
          deadline_at?: string | null
          export_expires_at?: string | null
          export_url?: string | null
          id?: string
          legal_hold?: boolean | null
          legal_hold_reason?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          request_type: string
          requested_by_email: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          verification_code?: string | null
          verified_at?: string | null
        }
        Update: {
          completion_notes?: string | null
          created_at?: string | null
          deadline_at?: string | null
          export_expires_at?: string | null
          export_url?: string | null
          id?: string
          legal_hold?: boolean | null
          legal_hold_reason?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          request_type?: string
          requested_by_email?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          verification_code?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_deletion_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_library: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          difficulty: Database["public"]["Enums"]["experience_level"] | null
          equipment: string[] | null
          form_cues: string[] | null
          id: string
          is_active: boolean | null
          is_compound: boolean | null
          muscle_groups: string[] | null
          name: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["experience_level"] | null
          equipment?: string[] | null
          form_cues?: string[] | null
          id?: string
          is_active?: boolean | null
          is_compound?: boolean | null
          muscle_groups?: string[] | null
          name: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["experience_level"] | null
          equipment?: string[] | null
          form_cues?: string[] | null
          id?: string
          is_active?: boolean | null
          is_compound?: boolean | null
          muscle_groups?: string[] | null
          name?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      flag_acknowledgements: {
        Row: {
          acknowledged_at: string | null
          action_taken: string | null
          coach_id: string
          flag_id: string
          follow_up_completed: boolean | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          notes: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          action_taken?: string | null
          coach_id: string
          flag_id: string
          follow_up_completed?: boolean | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          notes?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          action_taken?: string | null
          coach_id?: string
          flag_id?: string
          follow_up_completed?: boolean | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flag_acknowledgements_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flag_acknowledgements_flag_id_fkey"
            columns: ["flag_id"]
            isOneToOne: false
            referencedRelation: "risk_flags"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string | null
          currency: string | null
          discount_amount: number | null
          id: string
          invoice_date: string
          invoice_number: string
          line_items: Json
          notes: string | null
          payment_id: string | null
          pdf_generated_at: string | null
          pdf_url: string | null
          status: string | null
          subscription_id: string | null
          subtotal: number
          tax_amount: number | null
          tax_number: string | null
          tax_rate: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          id?: string
          invoice_date?: string
          invoice_number: string
          line_items?: Json
          notes?: string | null
          payment_id?: string | null
          pdf_generated_at?: string | null
          pdf_url?: string | null
          status?: string | null
          subscription_id?: string | null
          subtotal: number
          tax_amount?: number | null
          tax_number?: string | null
          tax_rate?: number | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          line_items?: Json
          notes?: string | null
          payment_id?: string | null
          pdf_generated_at?: string | null
          pdf_url?: string | null
          status?: string | null
          subscription_id?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_number?: string | null
          tax_rate?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_items: {
        Row: {
          alternatives: string[] | null
          calories: number | null
          carbs_g: number | null
          created_at: string | null
          fat_g: number | null
          fiber_g: number | null
          food_name: string
          id: string
          meal_id: string
          preparation_notes: string | null
          protein_g: number | null
          quantity: number
          sort_order: number | null
          unit: string
        }
        Insert: {
          alternatives?: string[] | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          food_name: string
          id?: string
          meal_id: string
          preparation_notes?: string | null
          protein_g?: number | null
          quantity: number
          sort_order?: number | null
          unit: string
        }
        Update: {
          alternatives?: string[] | null
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          food_name?: string
          id?: string
          meal_id?: string
          preparation_notes?: string | null
          protein_g?: number | null
          quantity?: number
          sort_order?: number | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "nutrition_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          body_fat_percentage: number | null
          chest_cm: number | null
          client_id: string
          created_at: string | null
          hips_cm: number | null
          id: string
          left_arm_cm: number | null
          left_calf_cm: number | null
          left_thigh_cm: number | null
          measurement_date: string
          neck_cm: number | null
          notes: string | null
          right_arm_cm: number | null
          right_calf_cm: number | null
          right_thigh_cm: number | null
          shoulders_cm: number | null
          waist_cm: number | null
          weekly_checkin_id: string | null
        }
        Insert: {
          body_fat_percentage?: number | null
          chest_cm?: number | null
          client_id: string
          created_at?: string | null
          hips_cm?: number | null
          id?: string
          left_arm_cm?: number | null
          left_calf_cm?: number | null
          left_thigh_cm?: number | null
          measurement_date: string
          neck_cm?: number | null
          notes?: string | null
          right_arm_cm?: number | null
          right_calf_cm?: number | null
          right_thigh_cm?: number | null
          shoulders_cm?: number | null
          waist_cm?: number | null
          weekly_checkin_id?: string | null
        }
        Update: {
          body_fat_percentage?: number | null
          chest_cm?: number | null
          client_id?: string
          created_at?: string | null
          hips_cm?: number | null
          id?: string
          left_arm_cm?: number | null
          left_calf_cm?: number | null
          left_thigh_cm?: number | null
          measurement_date?: string
          neck_cm?: number | null
          notes?: string | null
          right_arm_cm?: number | null
          right_calf_cm?: number | null
          right_thigh_cm?: number | null
          shoulders_cm?: number | null
          waist_cm?: number | null
          weekly_checkin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "measurements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          message_type: string | null
          metadata: Json | null
          sender_id: string
          sender_role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["message_status"] | null
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          sender_id: string
          sender_role: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["message_status"] | null
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          sender_id?: string
          sender_role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["message_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_checkin_reminder: boolean | null
          email_messages: boolean | null
          email_plan_updates: boolean | null
          email_weekly_summary: boolean | null
          id: string
          push_checkin_reminder: boolean | null
          push_messages: boolean | null
          push_plan_updates: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_checkin_reminder?: boolean | null
          email_messages?: boolean | null
          email_plan_updates?: boolean | null
          email_weekly_summary?: boolean | null
          id?: string
          push_checkin_reminder?: boolean | null
          push_messages?: boolean | null
          push_plan_updates?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_checkin_reminder?: boolean | null
          email_messages?: boolean | null
          email_plan_updates?: boolean | null
          email_weekly_summary?: boolean | null
          id?: string
          push_checkin_reminder?: boolean | null
          push_messages?: boolean | null
          push_plan_updates?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          email_enabled: boolean | null
          email_error: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          id: string
          notification_type: string
          processed_at: string | null
          push_enabled: boolean | null
          push_error: string | null
          push_sent: boolean | null
          push_sent_at: string | null
          scheduled_for: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          email_enabled?: boolean | null
          email_error?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          notification_type: string
          processed_at?: string | null
          push_enabled?: boolean | null
          push_error?: string | null
          push_sent?: boolean | null
          push_sent_at?: string | null
          scheduled_for?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          email_enabled?: boolean | null
          email_error?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          id?: string
          notification_type?: string
          processed_at?: string | null
          push_enabled?: boolean | null
          push_error?: string | null
          push_sent?: boolean | null
          push_sent_at?: string | null
          scheduled_for?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_meals: {
        Row: {
          calories: number | null
          carbs_g: number | null
          created_at: string | null
          fat_g: number | null
          id: string
          meal_name: string
          meal_number: number
          meal_time: string | null
          plan_version_id: string
          protein_g: number | null
          sort_order: number | null
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          fat_g?: number | null
          id?: string
          meal_name: string
          meal_number: number
          meal_time?: string | null
          plan_version_id: string
          protein_g?: number | null
          sort_order?: number | null
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string | null
          fat_g?: number | null
          id?: string
          meal_name?: string
          meal_number?: number
          meal_time?: string | null
          plan_version_id?: string
          protein_g?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_meals_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plan_versions: {
        Row: {
          change_notes: string | null
          created_at: string | null
          created_by: string
          id: string
          is_current: boolean | null
          plan_data: Json
          plan_id: string
          version_number: number
        }
        Insert: {
          change_notes?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          is_current?: boolean | null
          plan_data: Json
          plan_id: string
          version_number?: number
        }
        Update: {
          change_notes?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          is_current?: boolean | null
          plan_data?: Json
          plan_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plan_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nutrition_plan_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "nutrition_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_plans: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          diet_type: Database["public"]["Enums"]["diet_preference"] | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          meal_count: number | null
          name: string
          target_calories: number | null
          target_carbs_g: number | null
          target_fat_g: number | null
          target_protein_g: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          diet_type?: Database["public"]["Enums"]["diet_preference"] | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          meal_count?: number | null
          name: string
          target_calories?: number | null
          target_carbs_g?: number | null
          target_fat_g?: number | null
          target_protein_g?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          diet_type?: Database["public"]["Enums"]["diet_preference"] | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          meal_count?: number | null
          name?: string
          target_calories?: number | null
          target_carbs_g?: number | null
          target_fat_g?: number | null
          target_protein_g?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          subscription_id: string
          transaction_reference: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          client_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          subscription_id: string
          transaction_reference?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          subscription_id?: string
          transaction_reference?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_photos: {
        Row: {
          client_id: string
          created_at: string | null
          encryption_key_id: string
          id: string
          notes: string | null
          photo_date: string
          photo_path_encrypted: string | null
          photo_type: string
          thumbnail_path_encrypted: string | null
          weekly_checkin_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          encryption_key_id?: string
          id?: string
          notes?: string | null
          photo_date: string
          photo_path_encrypted?: string | null
          photo_type: string
          thumbnail_path_encrypted?: string | null
          weekly_checkin_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          encryption_key_id?: string
          id?: string
          notes?: string | null
          photo_date?: string
          photo_path_encrypted?: string | null
          photo_type?: string
          thumbnail_path_encrypted?: string | null
          weekly_checkin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_photos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh_key: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh_key: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh_key?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      read_receipts: {
        Row: {
          id: string
          message_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "read_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_flags: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          flag_type: string
          id: string
          is_active: boolean | null
          medical_clearance_date: string | null
          medical_clearance_notes: string | null
          medical_clearance_obtained: boolean | null
          recommendations: string[] | null
          requires_medical_clearance: boolean | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          restrictions: string[] | null
          severity: Database["public"]["Enums"]["risk_severity"]
          source: string | null
          source_id: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          flag_type: string
          id?: string
          is_active?: boolean | null
          medical_clearance_date?: string | null
          medical_clearance_notes?: string | null
          medical_clearance_obtained?: boolean | null
          recommendations?: string[] | null
          requires_medical_clearance?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          restrictions?: string[] | null
          severity: Database["public"]["Enums"]["risk_severity"]
          source?: string | null
          source_id?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          flag_type?: string
          id?: string
          is_active?: boolean | null
          medical_clearance_date?: string | null
          medical_clearance_notes?: string | null
          medical_clearance_obtained?: boolean | null
          recommendations?: string[] | null
          requires_medical_clearance?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          restrictions?: string[] | null
          severity?: Database["public"]["Enums"]["risk_severity"]
          source?: string | null
          source_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_flags_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_flags_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          branding_color: string | null
          branding_name: string | null
          created_at: string | null
          currency: string | null
          daily_checkins_required: boolean | null
          description: string | null
          duration_days: number
          features: string[] | null
          id: string
          includes_messaging: boolean | null
          includes_nutrition: boolean | null
          includes_training: boolean | null
          is_active: boolean | null
          name: string
          price_amount: number
          sort_order: number | null
          updated_at: string | null
          weekly_checkins_required: boolean | null
        }
        Insert: {
          branding_color?: string | null
          branding_name?: string | null
          created_at?: string | null
          currency?: string | null
          daily_checkins_required?: boolean | null
          description?: string | null
          duration_days: number
          features?: string[] | null
          id?: string
          includes_messaging?: boolean | null
          includes_nutrition?: boolean | null
          includes_training?: boolean | null
          is_active?: boolean | null
          name: string
          price_amount: number
          sort_order?: number | null
          updated_at?: string | null
          weekly_checkins_required?: boolean | null
        }
        Update: {
          branding_color?: string | null
          branding_name?: string | null
          created_at?: string | null
          currency?: string | null
          daily_checkins_required?: boolean | null
          description?: string | null
          duration_days?: number
          features?: string[] | null
          id?: string
          includes_messaging?: boolean | null
          includes_nutrition?: boolean | null
          includes_training?: boolean | null
          is_active?: boolean | null
          name?: string
          price_amount?: number
          sort_order?: number | null
          updated_at?: string | null
          weekly_checkins_required?: boolean | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_paid: number | null
          client_id: string
          created_at: string | null
          currency: string | null
          end_date: string
          id: string
          notes: string | null
          paused_at: string | null
          plan_id: string
          resumed_at: string | null
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          client_id: string
          created_at?: string | null
          currency?: string | null
          end_date: string
          id?: string
          notes?: string | null
          paused_at?: string | null
          plan_id: string
          resumed_at?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          client_id?: string
          created_at?: string | null
          currency?: string | null
          end_date?: string
          id?: string
          notes?: string | null
          paused_at?: string | null
          plan_id?: string
          resumed_at?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      training_days: {
        Row: {
          created_at: string | null
          day_name: string
          day_number: number
          duration_minutes: number | null
          focus_areas: string[] | null
          id: string
          is_cardio_day: boolean | null
          is_rest_day: boolean | null
          plan_version_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          day_name: string
          day_number: number
          duration_minutes?: number | null
          focus_areas?: string[] | null
          id?: string
          is_cardio_day?: boolean | null
          is_rest_day?: boolean | null
          plan_version_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          day_name?: string
          day_number?: number
          duration_minutes?: number | null
          focus_areas?: string[] | null
          id?: string
          is_cardio_day?: boolean | null
          is_rest_day?: boolean | null
          plan_version_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_days_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "training_plan_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_exercises: {
        Row: {
          coach_notes: string | null
          created_at: string | null
          exercise_id: string | null
          exercise_name: string
          form_cues: string[] | null
          group_id: string | null
          group_type: string | null
          id: string
          reps: string
          rest_seconds: number | null
          sets: number
          sort_order: number | null
          tempo: string | null
          training_day_id: string
          weight_type: string | null
          weight_value: string | null
        }
        Insert: {
          coach_notes?: string | null
          created_at?: string | null
          exercise_id?: string | null
          exercise_name: string
          form_cues?: string[] | null
          group_id?: string | null
          group_type?: string | null
          id?: string
          reps: string
          rest_seconds?: number | null
          sets?: number
          sort_order?: number | null
          tempo?: string | null
          training_day_id: string
          weight_type?: string | null
          weight_value?: string | null
        }
        Update: {
          coach_notes?: string | null
          created_at?: string | null
          exercise_id?: string | null
          exercise_name?: string
          form_cues?: string[] | null
          group_id?: string | null
          group_type?: string | null
          id?: string
          reps?: string
          rest_seconds?: number | null
          sets?: number
          sort_order?: number | null
          tempo?: string | null
          training_day_id?: string
          weight_type?: string | null
          weight_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercise_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_exercises_training_day_id_fkey"
            columns: ["training_day_id"]
            isOneToOne: false
            referencedRelation: "training_days"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plan_versions: {
        Row: {
          change_notes: string | null
          created_at: string | null
          created_by: string
          id: string
          is_current: boolean | null
          plan_data: Json
          plan_id: string
          version_number: number
        }
        Insert: {
          change_notes?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          is_current?: boolean | null
          plan_data: Json
          plan_id: string
          version_number?: number
        }
        Update: {
          change_notes?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          is_current?: boolean | null
          plan_data?: Json
          plan_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_plan_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_plan_versions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plans: {
        Row: {
          created_at: string | null
          created_by: string
          days_per_week: number | null
          description: string | null
          experience_required:
            | Database["public"]["Enums"]["experience_level"]
            | null
          goal: string | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          name: string
          plan_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          days_per_week?: number | null
          description?: string | null
          experience_required?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          goal?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name: string
          plan_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          days_per_week?: number | null
          description?: string | null
          experience_required?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          goal?: string | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name?: string
          plan_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          city: string | null
          country_code: string | null
          created_at: string | null
          device_fingerprint: string | null
          expires_at: string
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_activity_at: string | null
          revoked_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity_at?: string | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity_at?: string | null
          revoked_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          age_verified: boolean | null
          age_verified_at: string | null
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          deleted_at: string | null
          display_name: string | null
          email: string
          email_verified: boolean | null
          first_name: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          last_name: string
          locale: string | null
          mfa_enabled: boolean | null
          mfa_method: string | null
          phone: string | null
          phone_verified: boolean | null
          preferences: Json | null
          role: Database["public"]["Enums"]["user_role"]
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          age_verified?: boolean | null
          age_verified_at?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email: string
          email_verified?: boolean | null
          first_name: string
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_name: string
          locale?: string | null
          mfa_enabled?: boolean | null
          mfa_method?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          age_verified?: boolean | null
          age_verified_at?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string
          email_verified?: boolean | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_name?: string
          locale?: string | null
          mfa_enabled?: boolean | null
          mfa_method?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      weekly_checkins: {
        Row: {
          challenges: string | null
          checkin_compliance_percent: number | null
          client_id: string
          coach_notes: string | null
          coach_reviewed: boolean | null
          coach_reviewed_at: string | null
          created_at: string | null
          id: string
          nutrition_compliance_percent: number | null
          questions_for_coach: string | null
          reviewed_by: string | null
          training_compliance_percent: number | null
          updated_at: string | null
          week_number: number | null
          week_start_date: string
          weekly_summary: string | null
          wins: string | null
        }
        Insert: {
          challenges?: string | null
          checkin_compliance_percent?: number | null
          client_id: string
          coach_notes?: string | null
          coach_reviewed?: boolean | null
          coach_reviewed_at?: string | null
          created_at?: string | null
          id?: string
          nutrition_compliance_percent?: number | null
          questions_for_coach?: string | null
          reviewed_by?: string | null
          training_compliance_percent?: number | null
          updated_at?: string | null
          week_number?: number | null
          week_start_date: string
          weekly_summary?: string | null
          wins?: string | null
        }
        Update: {
          challenges?: string | null
          checkin_compliance_percent?: number | null
          client_id?: string
          coach_notes?: string | null
          coach_reviewed?: boolean | null
          coach_reviewed_at?: string | null
          created_at?: string | null
          id?: string
          nutrition_compliance_percent?: number | null
          questions_for_coach?: string | null
          reviewed_by?: string | null
          training_compliance_percent?: number | null
          updated_at?: string | null
          week_number?: number | null
          week_start_date?: string
          weekly_summary?: string | null
          wins?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_checkins_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_checkins_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_logs: {
        Row: {
          checkin_id: string | null
          client_id: string
          created_at: string | null
          id: string
          log_date: string
          source: string | null
          weight_kg: number
        }
        Insert: {
          checkin_id?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          log_date: string
          source?: string | null
          weight_kg: number
        }
        Update: {
          checkin_id?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          log_date?: string
          source?: string | null
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_logs_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: false
            referencedRelation: "daily_checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_delete_user: { Args: { p_user_id: string }; Returns: boolean }
      client_has_medical_consent: {
        Args: { p_client_id: string }
        Returns: boolean
      }
      coach_has_client_access: {
        Args: { p_client_id: string }
        Returns: boolean
      }
      get_client_id: { Args: never; Returns: string }
      get_coach_id: { Args: never; Returns: string }
      get_subscription_days_remaining: {
        Args: { p_client_id: string }
        Returns: number
      }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_client: { Args: never; Returns: boolean }
      is_coach: { Args: never; Returns: boolean }
      is_subscription_expiring_soon: {
        Args: { p_client_id: string; p_days?: number }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      activity_level:
        | "sedentary"
        | "lightly_active"
        | "moderately_active"
        | "very_active"
        | "extremely_active"
      audit_action:
        | "create"
        | "read"
        | "update"
        | "delete"
        | "export"
        | "login"
        | "logout"
      consent_type:
        | "data_processing"
        | "marketing"
        | "medical_data_sharing"
        | "photo_usage"
        | "terms_of_service"
      diet_preference: "vegetarian" | "eggetarian" | "non_vegetarian" | "vegan"
      experience_level:
        | "beginner"
        | "intermediate"
        | "advanced"
        | "professional"
      frequency_type:
        | "never"
        | "rarely"
        | "occasionally"
        | "frequently"
        | "daily"
      gender_type: "male" | "female" | "other" | "prefer_not_to_say"
      message_status: "sent" | "delivered" | "read"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      quality_rating: "poor" | "fair" | "good" | "excellent"
      risk_severity: "low" | "medium" | "high" | "critical"
      subscription_status:
        | "active"
        | "expired"
        | "cancelled"
        | "unpaid"
        | "paused"
      user_role: "super_admin" | "coach" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_level: [
        "sedentary",
        "lightly_active",
        "moderately_active",
        "very_active",
        "extremely_active",
      ],
      audit_action: [
        "create",
        "read",
        "update",
        "delete",
        "export",
        "login",
        "logout",
      ],
      consent_type: [
        "data_processing",
        "marketing",
        "medical_data_sharing",
        "photo_usage",
        "terms_of_service",
      ],
      diet_preference: ["vegetarian", "eggetarian", "non_vegetarian", "vegan"],
      experience_level: [
        "beginner",
        "intermediate",
        "advanced",
        "professional",
      ],
      frequency_type: [
        "never",
        "rarely",
        "occasionally",
        "frequently",
        "daily",
      ],
      gender_type: ["male", "female", "other", "prefer_not_to_say"],
      message_status: ["sent", "delivered", "read"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      quality_rating: ["poor", "fair", "good", "excellent"],
      risk_severity: ["low", "medium", "high", "critical"],
      subscription_status: [
        "active",
        "expired",
        "cancelled",
        "unpaid",
        "paused",
      ],
      user_role: ["super_admin", "coach", "client"],
    },
  },
} as const
