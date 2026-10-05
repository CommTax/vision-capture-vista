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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          enabled: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          enabled?: boolean
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          enabled?: boolean
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      content_blocks: {
        Row: {
          active: boolean
          created_at: string
          data: Json
          key: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          data: Json
          key: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          data?: Json
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_drills: {
        Row: {
          active: boolean
          created_at: string
          data: Json
          id: string
          skill: string
          sort: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          data?: Json
          id: string
          skill: string
          sort?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          data?: Json
          id?: string
          skill?: string
          sort?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_modes: {
        Row: {
          active: boolean
          created_at: string
          data: Json
          description: string | null
          id: string
          name: string
          sort: number
          tag: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          data?: Json
          description?: string | null
          id: string
          name: string
          sort?: number
          tag?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          data?: Json
          description?: string | null
          id?: string
          name?: string
          sort?: number
          tag?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      content_patterns: {
        Row: {
          active: boolean
          created_at: string
          data: Json
          description: string | null
          id: string
          line: string | null
          name: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          data?: Json
          description?: string | null
          id: string
          line?: string | null
          name: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          data?: Json
          description?: string | null
          id?: string
          line?: string | null
          name?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_questions: {
        Row: {
          active: boolean
          context: string | null
          created_at: string
          data: Json
          difficulty: string
          id: string
          mode: string
          prompt: string
          recommended_when: string[]
          sort: number
          target_skills: string[]
          time_limit: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          context?: string | null
          created_at?: string
          data?: Json
          difficulty?: string
          id: string
          mode: string
          prompt: string
          recommended_when?: string[]
          sort?: number
          target_skills?: string[]
          time_limit?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          context?: string | null
          created_at?: string
          data?: Json
          difficulty?: string
          id?: string
          mode?: string
          prompt?: string
          recommended_when?: string[]
          sort?: number
          target_skills?: string[]
          time_limit?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      entitlements: {
        Row: {
          data: Json | null
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          data?: Json | null
          state?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          data?: Json | null
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      free_attempts: {
        Row: {
          analysis_id: string | null
          attempt_number: number
          entitlement_type: string
          id: string
          response_id: string
          scenario_id: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          analysis_id?: string | null
          attempt_number: number
          entitlement_type?: string
          id?: string
          response_id: string
          scenario_id: string
          submitted_at: string
          user_id: string
        }
        Update: {
          analysis_id?: string | null
          attempt_number?: number
          entitlement_type?: string
          id?: string
          response_id?: string
          scenario_id?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          consent_at: string | null
          created_at: string
          email: string
          id: string
          marketing_consent: boolean
          name: string
          phone: string | null
          phone_country_code: string | null
          prefs: Json
          updated_at: string
        }
        Insert: {
          consent_at?: string | null
          created_at?: string
          email: string
          id: string
          marketing_consent?: boolean
          name?: string
          phone?: string | null
          phone_country_code?: string | null
          prefs?: Json
          updated_at?: string
        }
        Update: {
          consent_at?: string | null
          created_at?: string
          email?: string
          id?: string
          marketing_consent?: boolean
          name?: string
          phone?: string | null
          phone_country_code?: string | null
          prefs?: Json
          updated_at?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_redemptions: {
        Row: {
          code: string
          created_at: string
          friend_id: string
          id: string
          referrer_id: string
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          friend_id: string
          id?: string
          referrer_id: string
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          friend_id?: string
          id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      responses: {
        Row: {
          created_at: string
          id: string
          record: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          record: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          record?: Json
          user_id?: string
        }
        Relationships: []
      }
      share_rewards: {
        Row: {
          created_at: string
          discount_code: string | null
          discount_pct: number | null
          id: string
          instagram_handle: string | null
          kind: string
          post_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_code?: string | null
          discount_pct?: number | null
          id?: string
          instagram_handle?: string | null
          kind: string
          post_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discount_code?: string | null
          discount_pct?: number | null
          id?: string
          instagram_handle?: string | null
          kind?: string
          post_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
