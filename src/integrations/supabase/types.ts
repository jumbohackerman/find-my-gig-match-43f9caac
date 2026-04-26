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
      ai_shortlist_snapshots: {
        Row: {
          ai_justification: string
          ai_shortlist_id: string
          candidate_id: string
          created_at: string
          id: string
          job_id: string
          rank: number
          shortlist_id: string | null
          shortlist_score: number
          snapshot_education: Json | null
          snapshot_experience: Json | null
          snapshot_full_name: string | null
          snapshot_job_title: string | null
          snapshot_languages: Json | null
          snapshot_level: string | null
          snapshot_links: Json | null
          snapshot_location: string | null
          snapshot_salary_max: number | null
          snapshot_salary_min: number | null
          snapshot_skills: Json | null
          snapshot_summary: string | null
        }
        Insert: {
          ai_justification: string
          ai_shortlist_id: string
          candidate_id: string
          created_at?: string
          id?: string
          job_id: string
          rank: number
          shortlist_id?: string | null
          shortlist_score: number
          snapshot_education?: Json | null
          snapshot_experience?: Json | null
          snapshot_full_name?: string | null
          snapshot_job_title?: string | null
          snapshot_languages?: Json | null
          snapshot_level?: string | null
          snapshot_links?: Json | null
          snapshot_location?: string | null
          snapshot_salary_max?: number | null
          snapshot_salary_min?: number | null
          snapshot_skills?: Json | null
          snapshot_summary?: string | null
        }
        Update: {
          ai_justification?: string
          ai_shortlist_id?: string
          candidate_id?: string
          created_at?: string
          id?: string
          job_id?: string
          rank?: number
          shortlist_id?: string | null
          shortlist_score?: number
          snapshot_education?: Json | null
          snapshot_experience?: Json | null
          snapshot_full_name?: string | null
          snapshot_job_title?: string | null
          snapshot_languages?: Json | null
          snapshot_level?: string | null
          snapshot_links?: Json | null
          snapshot_location?: string | null
          snapshot_salary_max?: number | null
          snapshot_salary_min?: number | null
          snapshot_skills?: Json | null
          snapshot_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_shortlist_snapshots_ai_shortlist_id_fkey"
            columns: ["ai_shortlist_id"]
            isOneToOne: false
            referencedRelation: "ai_shortlists"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_shortlists: {
        Row: {
          ai_model_used: string | null
          completed_at: string | null
          created_at: string
          employer_id: string
          error_message: string | null
          id: string
          job_id: string
          status: string
          total_candidates_analyzed: number | null
          triggered_at: string
        }
        Insert: {
          ai_model_used?: string | null
          completed_at?: string | null
          created_at?: string
          employer_id: string
          error_message?: string | null
          id?: string
          job_id: string
          status?: string
          total_candidates_analyzed?: number | null
          triggered_at?: string
        }
        Update: {
          ai_model_used?: string | null
          completed_at?: string | null
          created_at?: string
          employer_id?: string
          error_message?: string | null
          id?: string
          job_id?: string
          status?: string
          total_candidates_analyzed?: number | null
          triggered_at?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          applied_at: string
          candidate_id: string
          id: string
          job_id: string
          source: string
          status: string
        }
        Insert: {
          applied_at?: string
          candidate_id: string
          id?: string
          job_id: string
          source?: string
          status?: string
        }
        Update: {
          applied_at?: string
          candidate_id?: string
          id?: string
          job_id?: string
          source?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          metadata: Json
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      candidate_activity_log: {
        Row: {
          action: string
          application_id: string
          candidate_id: string
          created_at: string
          employer_id: string
          id: string
          job_id: string
          metadata: Json
        }
        Insert: {
          action: string
          application_id: string
          candidate_id: string
          created_at?: string
          employer_id: string
          id?: string
          job_id: string
          metadata?: Json
        }
        Update: {
          action?: string
          application_id?: string
          candidate_id?: string
          created_at?: string
          employer_id?: string
          id?: string
          job_id?: string
          metadata?: Json
        }
        Relationships: []
      }
      candidate_consents: {
        Row: {
          ai_processing_consent: boolean
          candidate_id: string
          consented_at: string | null
          created_at: string
          id: string
          ip_address: string | null
          updated_at: string
        }
        Insert: {
          ai_processing_consent?: boolean
          candidate_id: string
          consented_at?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          updated_at?: string
        }
        Update: {
          ai_processing_consent?: boolean
          candidate_id?: string
          consented_at?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      candidate_notes: {
        Row: {
          application_id: string
          candidate_id: string
          created_at: string
          employer_id: string
          id: string
          job_id: string
          note: string
          updated_at: string
        }
        Insert: {
          application_id: string
          candidate_id: string
          created_at?: string
          employer_id: string
          id?: string
          job_id: string
          note: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          candidate_id?: string
          created_at?: string
          employer_id?: string
          id?: string
          job_id?: string
          note?: string
          updated_at?: string
        }
        Relationships: []
      }
      candidates: {
        Row: {
          availability: string
          bio: string
          created_at: string
          cv_url: string | null
          employment_type: string
          experience: string
          experience_entries: Json
          full_name: string
          id: string
          languages: Json
          last_active: string
          links: Json
          location: string
          normalized_title: string
          primary_industry: string
          profile_completeness: number
          relocation_openness: boolean
          salary_currency: string
          salary_max: number
          salary_min: number
          seniority: string
          skills: Json
          summary: string
          title: string
          updated_at: string
          user_id: string
          work_mode: string
          years_of_experience: number
        }
        Insert: {
          availability?: string
          bio?: string
          created_at?: string
          cv_url?: string | null
          employment_type?: string
          experience?: string
          experience_entries?: Json
          full_name?: string
          id?: string
          languages?: Json
          last_active?: string
          links?: Json
          location?: string
          normalized_title?: string
          primary_industry?: string
          profile_completeness?: number
          relocation_openness?: boolean
          salary_currency?: string
          salary_max?: number
          salary_min?: number
          seniority?: string
          skills?: Json
          summary?: string
          title?: string
          updated_at?: string
          user_id: string
          work_mode?: string
          years_of_experience?: number
        }
        Update: {
          availability?: string
          bio?: string
          created_at?: string
          cv_url?: string | null
          employment_type?: string
          experience?: string
          experience_entries?: Json
          full_name?: string
          id?: string
          languages?: Json
          last_active?: string
          links?: Json
          location?: string
          normalized_title?: string
          primary_industry?: string
          profile_completeness?: number
          relocation_openness?: boolean
          salary_currency?: string
          salary_max?: number
          salary_min?: number
          seniority?: string
          skills?: Json
          summary?: string
          title?: string
          updated_at?: string
          user_id?: string
          work_mode?: string
          years_of_experience?: number
        }
        Relationships: []
      }
      contact_invitations: {
        Row: {
          ai_shortlist_snapshot_id: string
          candidate_id: string
          created_at: string
          employer_id: string
          employer_message: string | null
          id: string
          job_id: string
          responded_at: string | null
          status: string
        }
        Insert: {
          ai_shortlist_snapshot_id: string
          candidate_id: string
          created_at?: string
          employer_id: string
          employer_message?: string | null
          id?: string
          job_id: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          ai_shortlist_snapshot_id?: string
          candidate_id?: string
          created_at?: string
          employer_id?: string
          employer_message?: string | null
          id?: string
          job_id?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_invitations_ai_shortlist_snapshot_id_fkey"
            columns: ["ai_shortlist_snapshot_id"]
            isOneToOne: false
            referencedRelation: "ai_shortlist_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_parsed_data: {
        Row: {
          created_at: string
          cv_upload_id: string
          id: string
          model_name: string | null
          parse_confidence: number | null
          parsed_json: Json | null
          raw_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cv_upload_id: string
          id?: string
          model_name?: string | null
          parse_confidence?: number | null
          parsed_json?: Json | null
          raw_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cv_upload_id?: string
          id?: string
          model_name?: string | null
          parse_confidence?: number | null
          parsed_json?: Json | null
          raw_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cv_parsed_data_cv_upload_id_fkey"
            columns: ["cv_upload_id"]
            isOneToOne: true
            referencedRelation: "cv_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_uploads: {
        Row: {
          created_at: string
          error_message: string | null
          file_name: string
          file_path: string
          id: string
          mime_type: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_name: string
          file_path: string
          id?: string
          mime_type?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          about_company: string
          about_role: string
          ai_shortlist_id: string | null
          apply_url: string
          benefits: string[]
          closed_at: string | null
          closure_reason: string | null
          company: string
          contract_type: string
          created_at: string
          description: string
          employer_id: string
          experience_level: string
          id: string
          location: string
          logo: string
          nice_to_have: string[]
          offer_highlights: string[]
          recruitment_steps: string[]
          requirements: string[]
          responsibilities: string[]
          salary: string
          salary_currency: string
          salary_from: number
          salary_to: number
          seniority: string
          status: string
          summary: string
          tags: string[]
          team_size: string
          title: string
          type: string
          updated_at: string
          work_mode: string
        }
        Insert: {
          about_company?: string
          about_role?: string
          ai_shortlist_id?: string | null
          apply_url?: string
          benefits?: string[]
          closed_at?: string | null
          closure_reason?: string | null
          company: string
          contract_type?: string
          created_at?: string
          description?: string
          employer_id: string
          experience_level?: string
          id?: string
          location: string
          logo?: string
          nice_to_have?: string[]
          offer_highlights?: string[]
          recruitment_steps?: string[]
          requirements?: string[]
          responsibilities?: string[]
          salary?: string
          salary_currency?: string
          salary_from?: number
          salary_to?: number
          seniority?: string
          status?: string
          summary?: string
          tags?: string[]
          team_size?: string
          title: string
          type?: string
          updated_at?: string
          work_mode?: string
        }
        Update: {
          about_company?: string
          about_role?: string
          ai_shortlist_id?: string | null
          apply_url?: string
          benefits?: string[]
          closed_at?: string | null
          closure_reason?: string | null
          company?: string
          contract_type?: string
          created_at?: string
          description?: string
          employer_id?: string
          experience_level?: string
          id?: string
          location?: string
          logo?: string
          nice_to_have?: string[]
          offer_highlights?: string[]
          recruitment_steps?: string[]
          requirements?: string[]
          responsibilities?: string[]
          salary?: string
          salary_currency?: string
          salary_from?: number
          salary_to?: number
          seniority?: string
          status?: string
          summary?: string
          tags?: string[]
          team_size?: string
          title?: string
          type?: string
          updated_at?: string
          work_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_ai_shortlist_id_fkey"
            columns: ["ai_shortlist_id"]
            isOneToOne: false
            referencedRelation: "ai_shortlists"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          application_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          application_id: string
          content?: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          application_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read: boolean
          reference_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          reference_id?: string | null
          title?: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          reference_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          company: string
          company_description: string
          company_industry: string
          company_location: string
          company_size: string
          company_website: string
          created_at: string
          full_name: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar?: string | null
          company?: string
          company_description?: string
          company_industry?: string
          company_location?: string
          company_size?: string
          company_website?: string
          created_at?: string
          full_name?: string
          id?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar?: string | null
          company?: string
          company_description?: string
          company_industry?: string
          company_location?: string
          company_size?: string
          company_website?: string
          created_at?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewer_notes: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      saved_jobs: {
        Row: {
          created_at: string
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      shortlist_events: {
        Row: {
          actor_id: string
          application_id: string | null
          candidate_id: string | null
          created_at: string
          employer_id: string
          event_type: string
          id: string
          idempotency_key: string | null
          job_id: string
          metadata: Json
          package_id: string | null
          package_size: number | null
          price_amount: number | null
          price_currency: string | null
          slots_after: number | null
          slots_before: number | null
        }
        Insert: {
          actor_id: string
          application_id?: string | null
          candidate_id?: string | null
          created_at?: string
          employer_id: string
          event_type: string
          id?: string
          idempotency_key?: string | null
          job_id: string
          metadata?: Json
          package_id?: string | null
          package_size?: number | null
          price_amount?: number | null
          price_currency?: string | null
          slots_after?: number | null
          slots_before?: number | null
        }
        Update: {
          actor_id?: string
          application_id?: string | null
          candidate_id?: string | null
          created_at?: string
          employer_id?: string
          event_type?: string
          id?: string
          idempotency_key?: string | null
          job_id?: string
          metadata?: Json
          package_id?: string | null
          package_size?: number | null
          price_amount?: number | null
          price_currency?: string | null
          slots_after?: number | null
          slots_before?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shortlist_events_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "shortlist_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      shortlist_packages: {
        Row: {
          employer_id: string
          exhausted_at: string | null
          id: string
          job_id: string
          package_size: number
          price_amount: number
          price_currency: string
          purchased_at: string
          slots_total: number
          slots_used: number
          status: string
        }
        Insert: {
          employer_id: string
          exhausted_at?: string | null
          id?: string
          job_id: string
          package_size: number
          price_amount: number
          price_currency?: string
          purchased_at?: string
          slots_total: number
          slots_used?: number
          status?: string
        }
        Update: {
          employer_id?: string
          exhausted_at?: string | null
          id?: string
          job_id?: string
          package_size?: number
          price_amount?: number
          price_currency?: string
          purchased_at?: string
          slots_total?: number
          slots_used?: number
          status?: string
        }
        Relationships: []
      }
      shortlist_snapshots: {
        Row: {
          application_id: string
          candidate_id: string
          candidate_snapshot: Json
          created_at: string
          employer_id: string
          id: string
          job_id: string
          job_snapshot: Json
          match_score: number | null
          shortlist_event_id: string
        }
        Insert: {
          application_id: string
          candidate_id: string
          candidate_snapshot: Json
          created_at?: string
          employer_id: string
          id?: string
          job_id: string
          job_snapshot: Json
          match_score?: number | null
          shortlist_event_id: string
        }
        Update: {
          application_id?: string
          candidate_id?: string
          candidate_snapshot?: Json
          created_at?: string
          employer_id?: string
          id?: string
          job_id?: string
          job_snapshot?: Json
          match_score?: number | null
          shortlist_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortlist_snapshots_shortlist_event_id_fkey"
            columns: ["shortlist_event_id"]
            isOneToOne: false
            referencedRelation: "shortlist_events"
            referencedColumns: ["id"]
          },
        ]
      }
      shortlists: {
        Row: {
          ai_model_used: string | null
          completed_at: string | null
          created_at: string
          employer_id: string
          error_message: string | null
          id: string
          job_id: string
          status: string
          total_candidates_analyzed: number | null
          triggered_at: string
        }
        Insert: {
          ai_model_used?: string | null
          completed_at?: string | null
          created_at?: string
          employer_id: string
          error_message?: string | null
          id?: string
          job_id: string
          status?: string
          total_candidates_analyzed?: number | null
          triggered_at?: string
        }
        Update: {
          ai_model_used?: string | null
          completed_at?: string | null
          created_at?: string
          employer_id?: string
          error_message?: string | null
          id?: string
          job_id?: string
          status?: string
          total_candidates_analyzed?: number | null
          triggered_at?: string
        }
        Relationships: []
      }
      swipe_events: {
        Row: {
          created_at: string
          direction: Database["public"]["Enums"]["swipe_direction"]
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direction: Database["public"]["Enums"]["swipe_direction"]
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          direction?: Database["public"]["Enums"]["swipe_direction"]
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swipe_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          id: string
          key: string
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          user_id: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_to_job: {
        Args: {
          _job_company: string
          _job_description: string
          _job_location: string
          _job_logo: string
          _job_salary: string
          _job_tags: string[]
          _job_title: string
          _job_type: string
          _static_job_id: string
        }
        Returns: string
      }
      compute_profile_completeness: {
        Args: { _user_id: string }
        Returns: number
      }
      get_remaining_slots: { Args: { _job_id: string }; Returns: number }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      hide_job: { Args: { _job_id: string }; Returns: undefined }
      is_candidate_shortlisted: {
        Args: { _application_id: string; _employer_id: string }
        Returns: boolean
      }
      purchase_shortlist_package: {
        Args: { _job_id: string; _package_size: number }
        Returns: string
      }
      shortlist_candidate: { Args: { _application_id: string }; Returns: Json }
      unhide_job: { Args: { _job_id: string }; Returns: undefined }
    }
    Enums: {
      notification_type:
        | "status_change"
        | "new_message"
        | "shortlisted"
        | "interview_scheduled"
        | "hired"
        | "contact_invitation"
        | "invitation_accepted"
        | "invitation_rejected"
        | "position_closed"
      swipe_direction: "left" | "right" | "save"
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
      notification_type: [
        "status_change",
        "new_message",
        "shortlisted",
        "interview_scheduled",
        "hired",
        "contact_invitation",
        "invitation_accepted",
        "invitation_rejected",
        "position_closed",
      ],
      swipe_direction: ["left", "right", "save"],
    },
  },
} as const
