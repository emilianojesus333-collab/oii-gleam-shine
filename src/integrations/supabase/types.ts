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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      body_measurements: {
        Row: {
          arms: number | null
          body_fat: number | null
          chest: number | null
          created_at: string
          date: string
          hips: number | null
          id: string
          notes: string | null
          thighs: number | null
          user_id: string
          waist: number | null
          weight: number | null
        }
        Insert: {
          arms?: number | null
          body_fat?: number | null
          chest?: number | null
          created_at?: string
          date: string
          hips?: number | null
          id?: string
          notes?: string | null
          thighs?: number | null
          user_id: string
          waist?: number | null
          weight?: number | null
        }
        Update: {
          arms?: number | null
          body_fat?: number | null
          chest?: number | null
          created_at?: string
          date?: string
          hips?: number | null
          id?: string
          notes?: string | null
          thighs?: number | null
          user_id?: string
          waist?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string
          equipment: string | null
          id: string
          name: string
          primary_muscle: Database["public"]["Enums"]["muscle_group"]
          secondary_muscles:
            | Database["public"]["Enums"]["muscle_group"][]
            | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          equipment?: string | null
          id?: string
          name: string
          primary_muscle: Database["public"]["Enums"]["muscle_group"]
          secondary_muscles?:
            | Database["public"]["Enums"]["muscle_group"][]
            | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          equipment?: string | null
          id?: string
          name?: string
          primary_muscle?: Database["public"]["Enums"]["muscle_group"]
          secondary_muscles?:
            | Database["public"]["Enums"]["muscle_group"][]
            | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_user: boolean
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_user?: boolean
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_user?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          meals: Json
          totals: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          meals?: Json
          totals?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          meals?: Json
          totals?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          created_at: string
          gender: string | null
          goal: string | null
          goal_calories: number | null
          goal_carbs: number | null
          goal_fat: number | null
          goal_protein: number | null
          height: number | null
          id: string
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          created_at?: string
          gender?: string | null
          goal?: string | null
          goal_calories?: number | null
          goal_carbs?: number | null
          goal_fat?: number | null
          goal_protein?: number | null
          height?: number | null
          id?: string
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          created_at?: string
          gender?: string | null
          goal?: string | null
          goal_calories?: number | null
          goal_carbs?: number | null
          goal_fat?: number | null
          goal_protein?: number | null
          height?: number | null
          id?: string
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      one_rm_records: {
        Row: {
          calculated_1rm: number
          created_at: string
          exercise_name: string
          id: string
          reps_performed: number
          user_id: string | null
          weight_used: number
        }
        Insert: {
          calculated_1rm: number
          created_at?: string
          exercise_name: string
          id?: string
          reps_performed: number
          user_id?: string | null
          weight_used: number
        }
        Update: {
          calculated_1rm?: number
          created_at?: string
          exercise_name?: string
          id?: string
          reps_performed?: number
          user_id?: string | null
          weight_used?: number
        }
        Relationships: []
      }
      progression_logs: {
        Row: {
          algorithm_version: string
          base_weight: number | null
          confidence: Database["public"]["Enums"]["progression_confidence"]
          created_at: string
          data_quality: string | null
          decision: Database["public"]["Enums"]["progression_decision"]
          exercise_id: string
          fatigue_ratio: number | null
          fatigue_score: number | null
          fatigue_status: string | null
          frequency_days: number | null
          frequency_score: number | null
          id: string
          last_7_days_volume: number | null
          proximity: string | null
          rpe_avg: number | null
          rpe_score: number | null
          score: number
          session_id: string
          suggested_increment_pct: number | null
          suggested_weight: number | null
          training_days_3d: number | null
          training_days_7d: number | null
          user_id: string
          volume_trend_pct: number | null
          volume_trend_score: number | null
          weights: Json
        }
        Insert: {
          algorithm_version?: string
          base_weight?: number | null
          confidence: Database["public"]["Enums"]["progression_confidence"]
          created_at?: string
          data_quality?: string | null
          decision: Database["public"]["Enums"]["progression_decision"]
          exercise_id: string
          fatigue_ratio?: number | null
          fatigue_score?: number | null
          fatigue_status?: string | null
          frequency_days?: number | null
          frequency_score?: number | null
          id?: string
          last_7_days_volume?: number | null
          proximity?: string | null
          rpe_avg?: number | null
          rpe_score?: number | null
          score: number
          session_id: string
          suggested_increment_pct?: number | null
          suggested_weight?: number | null
          training_days_3d?: number | null
          training_days_7d?: number | null
          user_id: string
          volume_trend_pct?: number | null
          volume_trend_score?: number | null
          weights?: Json
        }
        Update: {
          algorithm_version?: string
          base_weight?: number | null
          confidence?: Database["public"]["Enums"]["progression_confidence"]
          created_at?: string
          data_quality?: string | null
          decision?: Database["public"]["Enums"]["progression_decision"]
          exercise_id?: string
          fatigue_ratio?: number | null
          fatigue_score?: number | null
          fatigue_status?: string | null
          frequency_days?: number | null
          frequency_score?: number | null
          id?: string
          last_7_days_volume?: number | null
          proximity?: string | null
          rpe_avg?: number | null
          rpe_score?: number | null
          score?: number
          session_id?: string
          suggested_increment_pct?: number | null
          suggested_weight?: number | null
          training_days_3d?: number | null
          training_days_7d?: number | null
          user_id?: string
          volume_trend_pct?: number | null
          volume_trend_score?: number | null
          weights?: Json
        }
        Relationships: [
          {
            foreignKeyName: "progression_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progression_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      recovery_logs: {
        Row: {
          created_at: string
          date: string
          fatigue_level: number | null
          id: string
          notes: string | null
          sleep_hours: number | null
          sleep_quality: number | null
          stress_level: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          fatigue_level?: number | null
          id?: string
          notes?: string | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          fatigue_level?: number | null
          id?: string
          notes?: string | null
          sleep_hours?: number | null
          sleep_quality?: number | null
          stress_level?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          ai_name: string | null
          alerts_config: Json | null
          created_at: string
          has_completed_onboarding: boolean
          id: string
          onboarding_data: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_name?: string | null
          alerts_config?: Json | null
          created_at?: string
          has_completed_onboarding?: boolean
          id?: string
          onboarding_data?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_name?: string | null
          alerts_config?: Json | null
          created_at?: string
          has_completed_onboarding?: boolean
          id?: string
          onboarding_data?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          completion_rate: number | null
          created_at: string
          date: string
          day_of_week: string | null
          exercise_logs: Json
          exercises_completed: string[] | null
          id: string
          muscle_groups: string[] | null
          status: Database["public"]["Enums"]["session_status"]
          total_exercises: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completion_rate?: number | null
          created_at?: string
          date: string
          day_of_week?: string | null
          exercise_logs?: Json
          exercises_completed?: string[] | null
          id?: string
          muscle_groups?: string[] | null
          status?: Database["public"]["Enums"]["session_status"]
          total_exercises?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completion_rate?: number | null
          created_at?: string
          date?: string
          day_of_week?: string | null
          exercise_logs?: Json
          exercises_completed?: string[] | null
          id?: string
          muscle_groups?: string[] | null
          status?: Database["public"]["Enums"]["session_status"]
          total_exercises?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_sets: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          reps: number
          rpe: number | null
          session_id: string
          set_number: number
          set_type: Database["public"]["Enums"]["set_type"]
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          reps?: number
          rpe?: number | null
          session_id: string
          set_number: number
          set_type?: Database["public"]["Enums"]["set_type"]
          user_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          reps?: number
          rpe?: number | null
          session_id?: string
          set_number?: number
          set_type?: Database["public"]["Enums"]["set_type"]
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      muscle_group:
        | "chest"
        | "back"
        | "shoulders"
        | "biceps"
        | "triceps"
        | "forearms"
        | "quadriceps"
        | "hamstrings"
        | "glutes"
        | "calves"
        | "abs"
        | "traps"
      progression_confidence: "low" | "medium" | "high"
      progression_decision: "progress" | "maintain" | "deload"
      session_status: "in_progress" | "completed"
      set_type: "working" | "warmup" | "dropset" | "failure" | "backoff"
      subscription_status:
        | "never_subscribed"
        | "active"
        | "expired"
        | "canceled_but_active"
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
      muscle_group: [
        "chest",
        "back",
        "shoulders",
        "biceps",
        "triceps",
        "forearms",
        "quadriceps",
        "hamstrings",
        "glutes",
        "calves",
        "abs",
        "traps",
      ],
      progression_confidence: ["low", "medium", "high"],
      progression_decision: ["progress", "maintain", "deload"],
      session_status: ["in_progress", "completed"],
      set_type: ["working", "warmup", "dropset", "failure", "backoff"],
      subscription_status: [
        "never_subscribed",
        "active",
        "expired",
        "canceled_but_active",
      ],
    },
  },
} as const
