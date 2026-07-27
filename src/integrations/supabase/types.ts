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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_code: string
          bank_name: string
          created_at: string
          id: string
          is_default: boolean
          recipient_code: string | null
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          bank_code: string
          bank_name: string
          created_at?: string
          id?: string
          is_default?: boolean
          recipient_code?: string | null
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_code?: string
          bank_name?: string
          created_at?: string
          id?: string
          is_default?: boolean
          recipient_code?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          agent_confirmed_at: string | null
          agent_id: string | null
          caution_fee: number
          caution_status: string
          check_in: string
          check_out: string
          created_at: string
          extra_fees_total: number
          guests: number
          hotel_ref: string | null
          id: string
          listing_id: string | null
          status: string
          total_amount: number
          user_id: string
        }
        Insert: {
          agent_confirmed_at?: string | null
          agent_id?: string | null
          caution_fee?: number
          caution_status?: string
          check_in: string
          check_out: string
          created_at?: string
          extra_fees_total?: number
          guests?: number
          hotel_ref?: string | null
          id?: string
          listing_id?: string | null
          status?: string
          total_amount: number
          user_id: string
        }
        Update: {
          agent_confirmed_at?: string | null
          agent_id?: string | null
          caution_fee?: number
          caution_status?: string
          check_in?: string
          check_out?: string
          created_at?: string
          extra_fees_total?: number
          guests?: number
          hotel_ref?: string | null
          id?: string
          listing_id?: string | null
          status?: string
          total_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          listing_id: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          listing_id?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          listing_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_appeals: {
        Row: {
          admin_by: string | null
          admin_note: string | null
          agent_id: string
          created_at: string
          id: string
          note: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          admin_by?: string | null
          admin_note?: string | null
          agent_id: string
          created_at?: string
          id?: string
          note: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          admin_by?: string | null
          admin_note?: string | null
          agent_id?: string
          created_at?: string
          id?: string
          note?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          admin_approved: boolean
          against_user: string
          amount: number
          booking_id: string | null
          created_at: string
          escalated_to_admin: boolean
          id: string
          inspection_id: string | null
          moderator_at: string | null
          moderator_by: string | null
          moderator_proposed_note: string | null
          moderator_proposed_resolution: string | null
          raised_by: string
          reason: string
          resolution: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_approved?: boolean
          against_user: string
          amount: number
          booking_id?: string | null
          created_at?: string
          escalated_to_admin?: boolean
          id?: string
          inspection_id?: string | null
          moderator_at?: string | null
          moderator_by?: string | null
          moderator_proposed_note?: string | null
          moderator_proposed_resolution?: string | null
          raised_by: string
          reason: string
          resolution?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_approved?: boolean
          against_user?: string
          amount?: number
          booking_id?: string | null
          created_at?: string
          escalated_to_admin?: boolean
          id?: string
          inspection_id?: string | null
          moderator_at?: string | null
          moderator_by?: string | null
          moderator_proposed_note?: string | null
          moderator_proposed_resolution?: string | null
          raised_by?: string
          reason?: string
          resolution?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          agent_id: string
          created_at: string
          fee: number
          id: string
          listing_id: string
          mode: string
          notes: string | null
          scheduled_at: string
          status: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          fee: number
          id?: string
          listing_id: string
          mode: string
          notes?: string | null
          scheduled_at: string
          status?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          fee?: number
          id?: string
          listing_id?: string
          mode?: string
          notes?: string | null
          scheduled_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_image_fingerprints: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          image_path: string
          listing_id: string | null
          phash: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          image_path: string
          listing_id?: string | null
          phash: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          image_path?: string
          listing_id?: string | null
          phash?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_image_fingerprints_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_unavailability: {
        Row: {
          created_at: string
          end_date: string
          id: string
          listing_id: string
          reason: string | null
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          listing_id: string
          reason?: string | null
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          listing_id?: string
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_unavailability_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          agent_id: string
          amenities: string[] | null
          area_sqm: number | null
          bathrooms: number | null
          bedrooms: number | null
          boost_days: number | null
          boost_fee: number | null
          boost_requested_at: string | null
          boost_status: string
          boost_until: string | null
          category: string | null
          caution_fee: number
          cert_type: string | null
          cert_url: string | null
          city: string | null
          created_at: string
          description: string | null
          extra_fees: Json
          featured: boolean
          fraud_flags: Json
          id: string
          images: string[] | null
          latitude: number | null
          location: string
          longitude: number | null
          nights_available: number | null
          price: number
          state: string | null
          status: string
          title: string
          tour_url: string | null
          type: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          amenities?: string[] | null
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          boost_days?: number | null
          boost_fee?: number | null
          boost_requested_at?: string | null
          boost_status?: string
          boost_until?: string | null
          category?: string | null
          caution_fee?: number
          cert_type?: string | null
          cert_url?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          extra_fees?: Json
          featured?: boolean
          fraud_flags?: Json
          id?: string
          images?: string[] | null
          latitude?: number | null
          location: string
          longitude?: number | null
          nights_available?: number | null
          price: number
          state?: string | null
          status?: string
          title: string
          tour_url?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          amenities?: string[] | null
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          boost_days?: number | null
          boost_fee?: number | null
          boost_requested_at?: string | null
          boost_status?: string
          boost_until?: string | null
          category?: string | null
          caution_fee?: number
          cert_type?: string | null
          cert_url?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          extra_fees?: Json
          featured?: boolean
          fraud_flags?: Json
          id?: string
          images?: string[] | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          nights_available?: number | null
          price?: number
          state?: string | null
          status?: string
          title?: string
          tour_url?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
          thread_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id: string
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agency_name: string | null
          agent_rating: number
          agent_reviews: number
          avatar_url: string | null
          bio: string | null
          created_at: string
          dispute_lien_until: string | null
          full_name: string | null
          id: string
          kyc_status: string
          terms_accepted_at: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          agency_name?: string | null
          agent_rating?: number
          agent_reviews?: number
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          dispute_lien_until?: string | null
          full_name?: string | null
          id?: string
          kyc_status?: string
          terms_accepted_at?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          agency_name?: string | null
          agent_rating?: number
          agent_reviews?: number
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          dispute_lien_until?: string | null
          full_name?: string | null
          id?: string
          kyc_status?: string
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      profiles_private: {
        Row: {
          created_at: string
          kyc_doc_url: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          kyc_doc_url?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          kyc_doc_url?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          username: string | null
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
          username?: string | null
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          available_balance: number
          escrow_balance: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number
          escrow_balance?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number
          escrow_balance?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          bank_account_id: string
          created_at: string
          failure_reason: string | null
          id: string
          paystack_reference: string | null
          paystack_transfer_code: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          created_at?: string
          failure_reason?: string | null
          id?: string
          paystack_reference?: string | null
          paystack_transfer_code?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          created_at?: string
          failure_reason?: string | null
          id?: string
          paystack_reference?: string | null
          paystack_transfer_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      agents_public: {
        Row: {
          agency_name: string | null
          agent_rating: number | null
          agent_reviews: number | null
          avatar_url: string | null
          bio: string | null
          full_name: string | null
          user_id: string | null
          username: string | null
          verified: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_boost: { Args: { _listing_id: string }; Returns: Json }
      claim_username: {
        Args: { _email: string; _preferred: string }
        Returns: string
      }
      confirm_booking_checkout: {
        Args: { _booking_id: string; _intact: boolean }
        Returns: Json
      }
      credit_paystack_wallet: {
        Args: { _amount: number; _reference: string; _user_id: string }
        Returns: Json
      }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_permanent_admin_email: { Args: { _email: string }; Returns: boolean }
      notify: {
        Args: {
          _body: string
          _link: string
          _title: string
          _type: string
          _user: string
        }
        Returns: undefined
      }
      reject_boost: { Args: { _listing_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "user" | "agent" | "admin" | "moderator"
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
      app_role: ["user", "agent", "admin", "moderator"],
    },
  },
} as const
