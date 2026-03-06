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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      affiliation_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          driving_school_id: string
          email: string
          email_exists: boolean | null
          expires_at: string | null
          id: string
          instructor_name: string
          rejected_at: string | null
          sent_at: string | null
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          driving_school_id: string
          email: string
          email_exists?: boolean | null
          expires_at?: string | null
          id?: string
          instructor_name: string
          rejected_at?: string | null
          sent_at?: string | null
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          driving_school_id?: string
          email?: string
          email_exists?: boolean | null
          expires_at?: string | null
          id?: string
          instructor_name?: string
          rejected_at?: string | null
          sent_at?: string | null
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliation_invitations_driving_school_id_fkey"
            columns: ["driving_school_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      autoescola_dashboard_settings: {
        Row: {
          accent_color: string | null
          autoescola_id: string
          background_color: string | null
          created_at: string | null
          font_family: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          sections_order: Json | null
          text_color: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          autoescola_id: string
          background_color?: string | null
          created_at?: string | null
          font_family?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          sections_order?: Json | null
          text_color?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          autoescola_id?: string
          background_color?: string | null
          created_at?: string | null
          font_family?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          sections_order?: Json | null
          text_color?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_digit: string | null
          account_holder: string
          account_number: string
          account_type: string
          agency: string
          bank_code: string | null
          bank_name: string
          cpf_cnpj: string
          created_at: string | null
          id: string
          instructor_id: string
          is_default: boolean | null
          is_verified: boolean | null
          updated_at: string | null
        }
        Insert: {
          account_digit?: string | null
          account_holder: string
          account_number: string
          account_type: string
          agency: string
          bank_code?: string | null
          bank_name: string
          cpf_cnpj: string
          created_at?: string | null
          id?: string
          instructor_id: string
          is_default?: boolean | null
          is_verified?: boolean | null
          updated_at?: string | null
        }
        Update: {
          account_digit?: string | null
          account_holder?: string
          account_number?: string
          account_type?: string
          agency?: string
          bank_code?: string | null
          bank_name?: string
          cpf_cnpj?: string
          created_at?: string | null
          id?: string
          instructor_id?: string
          is_default?: boolean | null
          is_verified?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: true
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          accepted_by: string | null
          accepted_by_school_at: string | null
          active_charge_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          completed_lessons_count: number | null
          confirmed_at: string | null
          created_at: string | null
          driving_school_id: string | null
          driving_school_instructor_id: string | null
          duration_hours: number
          end_time: string
          id: string
          instructor_amount: number
          instructor_id: string
          instructor_message: string | null
          is_affiliated_booking: boolean | null
          license_category: string
          package_lessons_count: number | null
          package_price: number | null
          package_type: string | null
          payment_deadline: string | null
          payment_status: string | null
          pickup_address: string
          pickup_latitude: number | null
          pickup_longitude: number | null
          platform_fee: number
          price_per_hour: number
          requested_at: string | null
          scheduled_date: string
          scheduled_slots: Json | null
          school_fee: number | null
          school_fee_rate: number | null
          school_fee_type: string | null
          start_time: string
          started_at: string | null
          status: string
          student_id: string
          student_message: string | null
          total_price: number
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          accepted_by?: string | null
          accepted_by_school_at?: string | null
          active_charge_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          completed_lessons_count?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          driving_school_id?: string | null
          driving_school_instructor_id?: string | null
          duration_hours?: number
          end_time: string
          id?: string
          instructor_amount?: number
          instructor_id: string
          instructor_message?: string | null
          is_affiliated_booking?: boolean | null
          license_category: string
          package_lessons_count?: number | null
          package_price?: number | null
          package_type?: string | null
          payment_deadline?: string | null
          payment_status?: string | null
          pickup_address: string
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          platform_fee?: number
          price_per_hour: number
          requested_at?: string | null
          scheduled_date: string
          scheduled_slots?: Json | null
          school_fee?: number | null
          school_fee_rate?: number | null
          school_fee_type?: string | null
          start_time: string
          started_at?: string | null
          status?: string
          student_id: string
          student_message?: string | null
          total_price: number
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          accepted_by?: string | null
          accepted_by_school_at?: string | null
          active_charge_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          completed_lessons_count?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          driving_school_id?: string | null
          driving_school_instructor_id?: string | null
          duration_hours?: number
          end_time?: string
          id?: string
          instructor_amount?: number
          instructor_id?: string
          instructor_message?: string | null
          is_affiliated_booking?: boolean | null
          license_category?: string
          package_lessons_count?: number | null
          package_price?: number | null
          package_type?: string | null
          payment_deadline?: string | null
          payment_status?: string | null
          pickup_address?: string
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          platform_fee?: number
          price_per_hour?: number
          requested_at?: string | null
          scheduled_date?: string
          scheduled_slots?: Json | null
          school_fee?: number | null
          school_fee_rate?: number | null
          school_fee_type?: string | null
          start_time?: string
          started_at?: string | null
          status?: string
          student_id?: string
          student_message?: string | null
          total_price?: number
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_active_charge_id_fkey"
            columns: ["active_charge_id"]
            isOneToOne: false
            referencedRelation: "payment_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_driving_school_id_fkey"
            columns: ["driving_school_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_driving_school_instructor_id_fkey"
            columns: ["driving_school_instructor_id"]
            isOneToOne: false
            referencedRelation: "driving_school_instructors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          booking_id: string | null
          conversation_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          booking_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          booking_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          driving_school_id: string | null
          id: string
          instructor_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          driving_school_id?: string | null
          id?: string
          instructor_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          driving_school_id?: string | null
          id?: string
          instructor_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_driving_school_id_fkey"
            columns: ["driving_school_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driving_school_instructors: {
        Row: {
          bio: string | null
          commission_rate: number | null
          created_at: string
          driving_school_id: string
          email: string
          fixed_fee: number | null
          id: string
          invitation_accepted_at: string | null
          invitation_sent_at: string | null
          invitation_status: string | null
          invitation_token: string | null
          is_account_linked: boolean | null
          last_location_update: string | null
          latitude: number | null
          license_categories: string[] | null
          linked_user_id: string | null
          linked_vehicle_ids: string[] | null
          longitude: number | null
          name: string
          phone: string | null
          photo_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          commission_rate?: number | null
          created_at?: string
          driving_school_id: string
          email: string
          fixed_fee?: number | null
          id?: string
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          invitation_status?: string | null
          invitation_token?: string | null
          is_account_linked?: boolean | null
          last_location_update?: string | null
          latitude?: number | null
          license_categories?: string[] | null
          linked_user_id?: string | null
          linked_vehicle_ids?: string[] | null
          longitude?: number | null
          name: string
          phone?: string | null
          photo_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          commission_rate?: number | null
          created_at?: string
          driving_school_id?: string
          email?: string
          fixed_fee?: number | null
          id?: string
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          invitation_status?: string | null
          invitation_token?: string | null
          is_account_linked?: boolean | null
          last_location_update?: string | null
          latitude?: number | null
          license_categories?: string[] | null
          linked_user_id?: string | null
          linked_vehicle_ids?: string[] | null
          longitude?: number | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driving_school_instructors_driving_school_id_fkey"
            columns: ["driving_school_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driving_school_instructors_linked_user_id_fkey"
            columns: ["linked_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_verification_codes: {
        Row: {
          attempts: number | null
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      instructor_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          instructor_id: string
          is_available: boolean | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          instructor_id: string
          is_available?: boolean | null
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          instructor_id?: string
          is_available?: boolean | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_availability_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_profiles: {
        Row: {
          acceptance_rate: number | null
          address_full: string | null
          available_afternoon: boolean | null
          available_evening: boolean | null
          available_morning: boolean | null
          average_rating: number | null
          bio: string | null
          business_license_url: string | null
          business_name: string | null
          city: string | null
          cnh_back_url: string | null
          cnh_front_url: string | null
          cnh_number: string | null
          cnpj: string | null
          complement: string | null
          cover_photo_url: string | null
          cpf: string | null
          created_at: string | null
          crlv_url: string | null
          experience_years: number | null
          id: string
          instructor_license: string | null
          instructor_license_url: string | null
          is_active: boolean | null
          is_driving_school: boolean | null
          is_online: boolean | null
          last_location_update: string | null
          latitude: number | null
          license_url: string | null
          location: unknown
          longitude: number | null
          neighborhood: string | null
          number: string | null
          onboarding_completed: boolean
          razao_social: string | null
          state: string | null
          street: string | null
          total_classes: number | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          vehicle_photo_url: string | null
          verification_status: string | null
          zipcode: string | null
        }
        Insert: {
          acceptance_rate?: number | null
          address_full?: string | null
          available_afternoon?: boolean | null
          available_evening?: boolean | null
          available_morning?: boolean | null
          average_rating?: number | null
          bio?: string | null
          business_license_url?: string | null
          business_name?: string | null
          city?: string | null
          cnh_back_url?: string | null
          cnh_front_url?: string | null
          cnh_number?: string | null
          cnpj?: string | null
          complement?: string | null
          cover_photo_url?: string | null
          cpf?: string | null
          created_at?: string | null
          crlv_url?: string | null
          experience_years?: number | null
          id?: string
          instructor_license?: string | null
          instructor_license_url?: string | null
          is_active?: boolean | null
          is_driving_school?: boolean | null
          is_online?: boolean | null
          last_location_update?: string | null
          latitude?: number | null
          license_url?: string | null
          location?: unknown
          longitude?: number | null
          neighborhood?: string | null
          number?: string | null
          onboarding_completed?: boolean
          razao_social?: string | null
          state?: string | null
          street?: string | null
          total_classes?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          vehicle_photo_url?: string | null
          verification_status?: string | null
          zipcode?: string | null
        }
        Update: {
          acceptance_rate?: number | null
          address_full?: string | null
          available_afternoon?: boolean | null
          available_evening?: boolean | null
          available_morning?: boolean | null
          average_rating?: number | null
          bio?: string | null
          business_license_url?: string | null
          business_name?: string | null
          city?: string | null
          cnh_back_url?: string | null
          cnh_front_url?: string | null
          cnh_number?: string | null
          cnpj?: string | null
          complement?: string | null
          cover_photo_url?: string | null
          cpf?: string | null
          created_at?: string | null
          crlv_url?: string | null
          experience_years?: number | null
          id?: string
          instructor_license?: string | null
          instructor_license_url?: string | null
          is_active?: boolean | null
          is_driving_school?: boolean | null
          is_online?: boolean | null
          last_location_update?: string | null
          latitude?: number | null
          license_url?: string | null
          location?: unknown
          longitude?: number | null
          neighborhood?: string | null
          number?: string | null
          onboarding_completed?: boolean
          razao_social?: string | null
          state?: string | null
          street?: string | null
          total_classes?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
          vehicle_photo_url?: string | null
          verification_status?: string | null
          zipcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_specialties: {
        Row: {
          created_at: string | null
          id: string
          instructor_id: string
          specialty: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          instructor_id: string
          specialty: string
        }
        Update: {
          created_at?: string | null
          id?: string
          instructor_id?: string
          specialty?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_specialties_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_videos: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          instructor_id: string
          is_public: boolean
          media_type: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_type: string | null
          video_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          instructor_id: string
          is_public?: boolean
          media_type?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_type?: string | null
          video_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          instructor_id?: string
          is_public?: boolean
          media_type?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_type?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_videos_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mp_connected_accounts: {
        Row: {
          connected_at: string | null
          created_at: string | null
          disconnected_at: string | null
          driving_school_id: string | null
          id: string
          instructor_id: string | null
          is_active: boolean | null
          last_refreshed_at: string | null
          mp_access_token: string
          mp_email: string | null
          mp_public_key: string | null
          mp_refresh_token: string | null
          mp_user_id: string
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          connected_at?: string | null
          created_at?: string | null
          disconnected_at?: string | null
          driving_school_id?: string | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          last_refreshed_at?: string | null
          mp_access_token: string
          mp_email?: string | null
          mp_public_key?: string | null
          mp_refresh_token?: string | null
          mp_user_id: string
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          connected_at?: string | null
          created_at?: string | null
          disconnected_at?: string | null
          driving_school_id?: string | null
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          last_refreshed_at?: string | null
          mp_access_token?: string
          mp_email?: string | null
          mp_public_key?: string | null
          mp_refresh_token?: string | null
          mp_user_id?: string
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mp_connected_accounts_driving_school_id_fkey"
            columns: ["driving_school_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mp_connected_accounts_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          booking_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          booking_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          booking_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          purpose: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          purpose: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          purpose?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      payment_charges: {
        Row: {
          booking_id: string
          checkout_url: string | null
          correlation_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          installments: number | null
          mp_merchant_order_id: string | null
          mp_payment_id: string | null
          mp_preference_id: string | null
          paid_at: string | null
          payer_email: string | null
          payer_name: string | null
          payer_tax_id: string | null
          payment_method: string | null
          payment_method_detail: string | null
          refunded_at: string | null
          status: string
          student_id: string
          updated_at: string | null
          value_cents: number
        }
        Insert: {
          booking_id: string
          checkout_url?: string | null
          correlation_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          installments?: number | null
          mp_merchant_order_id?: string | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          paid_at?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payer_tax_id?: string | null
          payment_method?: string | null
          payment_method_detail?: string | null
          refunded_at?: string | null
          status?: string
          student_id: string
          updated_at?: string | null
          value_cents: number
        }
        Update: {
          booking_id?: string
          checkout_url?: string | null
          correlation_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          installments?: number | null
          mp_merchant_order_id?: string | null
          mp_payment_id?: string | null
          mp_preference_id?: string | null
          paid_at?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payer_tax_id?: string | null
          payment_method?: string | null
          payment_method_detail?: string | null
          refunded_at?: string | null
          status?: string
          student_id?: string
          updated_at?: string | null
          value_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_charges_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_charges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pix_keys: {
        Row: {
          created_at: string | null
          driving_school_id: string | null
          id: string
          instructor_id: string | null
          is_default: boolean | null
          label: string | null
          pix_key: string
          pix_key_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          driving_school_id?: string | null
          id?: string
          instructor_id?: string | null
          is_default?: boolean | null
          label?: string | null
          pix_key: string
          pix_key_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          driving_school_id?: string | null
          id?: string
          instructor_id?: string | null
          is_default?: boolean | null
          label?: string | null
          pix_key?: string
          pix_key_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pix_keys_driving_school_id_fkey"
            columns: ["driving_school_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pix_keys_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string | null
          fee_type: string
          id: string
          is_active: boolean | null
          max_fee: number | null
          min_fee: number | null
          platform_fee_fixed: number
          platform_fee_percentage: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          fee_type?: string
          id?: string
          is_active?: boolean | null
          max_fee?: number | null
          min_fee?: number | null
          platform_fee_fixed?: number
          platform_fee_percentage?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          fee_type?: string
          id?: string
          is_active?: boolean | null
          max_fee?: number | null
          min_fee?: number | null
          platform_fee_fixed?: number
          platform_fee_percentage?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      pricing: {
        Row: {
          created_at: string | null
          custom_package_price: number | null
          custom_package_quantity: number | null
          id: string
          instructor_id: string
          is_active: boolean | null
          is_custom_package: boolean | null
          license_category: string
          package_10_price: number | null
          package_20_price: number | null
          package_5_price: number | null
          single_class_price: number
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          custom_package_price?: number | null
          custom_package_quantity?: number | null
          id?: string
          instructor_id: string
          is_active?: boolean | null
          is_custom_package?: boolean | null
          license_category: string
          package_10_price?: number | null
          package_20_price?: number | null
          package_5_price?: number | null
          single_class_price: number
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          custom_package_price?: number | null
          custom_package_quantity?: number | null
          id?: string
          instructor_id?: string
          is_active?: boolean | null
          is_custom_package?: boolean | null
          license_category?: string
          package_10_price?: number | null
          package_20_price?: number | null
          package_5_price?: number | null
          single_class_price?: number
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string | null
          flag_reason: string | null
          id: string
          instructor_id: string
          instructor_response: string | null
          is_featured: boolean | null
          is_flagged: boolean | null
          is_visible: boolean | null
          overall_rating: number
          positive_tags: string[] | null
          punctuality_rating: number | null
          response_date: string | null
          student_id: string
          teaching_rating: number | null
          updated_at: string | null
          value_rating: number | null
          vehicle_rating: number | null
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string | null
          flag_reason?: string | null
          id?: string
          instructor_id: string
          instructor_response?: string | null
          is_featured?: boolean | null
          is_flagged?: boolean | null
          is_visible?: boolean | null
          overall_rating: number
          positive_tags?: string[] | null
          punctuality_rating?: number | null
          response_date?: string | null
          student_id: string
          teaching_rating?: number | null
          updated_at?: string | null
          value_rating?: number | null
          vehicle_rating?: number | null
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string | null
          flag_reason?: string | null
          id?: string
          instructor_id?: string
          instructor_response?: string | null
          is_featured?: boolean | null
          is_flagged?: boolean | null
          is_visible?: boolean | null
          overall_rating?: number
          positive_tags?: string[] | null
          punctuality_rating?: number | null
          response_date?: string | null
          student_id?: string
          teaching_rating?: number | null
          updated_at?: string | null
          value_rating?: number | null
          vehicle_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      school_commission_settings: {
        Row: {
          commission_type: string
          created_at: string | null
          default_commission_rate: number
          default_fixed_fee: number | null
          driving_school_id: string
          id: string
          max_commission: number | null
          min_commission: number | null
          updated_at: string | null
        }
        Insert: {
          commission_type?: string
          created_at?: string | null
          default_commission_rate?: number
          default_fixed_fee?: number | null
          driving_school_id: string
          id?: string
          max_commission?: number | null
          min_commission?: number | null
          updated_at?: string | null
        }
        Update: {
          commission_type?: string
          created_at?: string | null
          default_commission_rate?: number
          default_fixed_fee?: number | null
          driving_school_id?: string
          id?: string
          max_commission?: number | null
          min_commission?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_commission_settings_driving_school_id_fkey"
            columns: ["driving_school_id"]
            isOneToOne: true
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_areas: {
        Row: {
          city: string
          created_at: string | null
          id: string
          instructor_id: string
          max_distance_km: number | null
          neighborhoods: string[] | null
          state: string
        }
        Insert: {
          city: string
          created_at?: string | null
          id?: string
          instructor_id: string
          max_distance_km?: number | null
          neighborhoods?: string[] | null
          state: string
        }
        Update: {
          city?: string
          created_at?: string | null
          id?: string
          instructor_id?: string
          max_distance_km?: number | null
          neighborhoods?: string[] | null
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_areas_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          city: string | null
          complement: string | null
          cpf: string | null
          created_at: string | null
          date_of_birth: string | null
          favorite_instructors: string[] | null
          has_anxiety: boolean | null
          id: string
          needs_adapted_vehicle: boolean | null
          neighborhood: string | null
          number: string | null
          preferred_language: string | null
          preferred_transmission: string | null
          state: string | null
          street: string | null
          total_classes_taken: number | null
          updated_at: string | null
          user_id: string
          zipcode: string | null
        }
        Insert: {
          city?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          favorite_instructors?: string[] | null
          has_anxiety?: boolean | null
          id?: string
          needs_adapted_vehicle?: boolean | null
          neighborhood?: string | null
          number?: string | null
          preferred_language?: string | null
          preferred_transmission?: string | null
          state?: string | null
          street?: string | null
          total_classes_taken?: number | null
          updated_at?: string | null
          user_id: string
          zipcode?: string | null
        }
        Update: {
          city?: string | null
          complement?: string | null
          cpf?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          favorite_instructors?: string[] | null
          has_anxiety?: boolean | null
          id?: string
          needs_adapted_vehicle?: boolean | null
          neighborhood?: string | null
          number?: string | null
          preferred_language?: string | null
          preferred_transmission?: string | null
          state?: string | null
          street?: string | null
          total_classes_taken?: number | null
          updated_at?: string | null
          user_id?: string
          zipcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          available_date: string | null
          booking_id: string
          charge_id: string | null
          created_at: string | null
          description: string | null
          driving_school_id: string | null
          gateway_fee: number | null
          gross_amount: number
          id: string
          instructor_id: string | null
          mp_payment_id: string | null
          net_amount: number
          platform_fee: number
          status: string
          student_id: string
          transaction_date: string | null
          transaction_type: string
          withdrawn_date: string | null
        }
        Insert: {
          available_date?: string | null
          booking_id: string
          charge_id?: string | null
          created_at?: string | null
          description?: string | null
          driving_school_id?: string | null
          gateway_fee?: number | null
          gross_amount: number
          id?: string
          instructor_id?: string | null
          mp_payment_id?: string | null
          net_amount: number
          platform_fee: number
          status?: string
          student_id: string
          transaction_date?: string | null
          transaction_type: string
          withdrawn_date?: string | null
        }
        Update: {
          available_date?: string | null
          booking_id?: string
          charge_id?: string | null
          created_at?: string | null
          description?: string | null
          driving_school_id?: string | null
          gateway_fee?: number | null
          gross_amount?: number
          id?: string
          instructor_id?: string | null
          mp_payment_id?: string | null
          net_amount?: number
          platform_fee?: number
          status?: string
          student_id?: string
          transaction_date?: string | null
          transaction_type?: string
          withdrawn_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_charge_id_fkey"
            columns: ["charge_id"]
            isOneToOne: false
            referencedRelation: "payment_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_driving_school_id_fkey"
            columns: ["driving_school_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          adaptation_type: string | null
          additional_photos: string[] | null
          brand: string
          color: string | null
          created_at: string | null
          crlv_url: string | null
          has_air_conditioning: boolean | null
          has_power_steering: boolean | null
          id: string
          instructor_id: string
          is_active: boolean | null
          is_adapted: boolean | null
          license_category: string
          license_plate: string
          main_photo_url: string | null
          model: string
          transmission: string
          updated_at: string | null
          vehicle_type: string
          year: number
        }
        Insert: {
          adaptation_type?: string | null
          additional_photos?: string[] | null
          brand: string
          color?: string | null
          created_at?: string | null
          crlv_url?: string | null
          has_air_conditioning?: boolean | null
          has_power_steering?: boolean | null
          id?: string
          instructor_id: string
          is_active?: boolean | null
          is_adapted?: boolean | null
          license_category: string
          license_plate: string
          main_photo_url?: string | null
          model: string
          transmission: string
          updated_at?: string | null
          vehicle_type: string
          year: number
        }
        Update: {
          adaptation_type?: string | null
          additional_photos?: string[] | null
          brand?: string
          color?: string | null
          created_at?: string | null
          crlv_url?: string | null
          has_air_conditioning?: boolean | null
          has_power_steering?: boolean | null
          id?: string
          instructor_id?: string
          is_active?: boolean | null
          is_adapted?: boolean | null
          license_category?: string
          license_plate?: string
          main_photo_url?: string | null
          model?: string
          transmission?: string
          updated_at?: string | null
          vehicle_type?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          account_holder: string | null
          account_number: string | null
          account_type: string | null
          amount: number
          bank_name: string | null
          completed_at: string | null
          cpf_cnpj: string | null
          created_at: string | null
          driving_school_id: string | null
          failure_reason: string | null
          id: string
          instructor_id: string | null
          mp_correlation_id: string | null
          mp_payment_id: string | null
          pix_key: string | null
          pix_key_type: string | null
          processed_at: string | null
          receipt_url: string | null
          requested_at: string | null
          status: string
          withdrawal_method: string | null
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          account_type?: string | null
          amount: number
          bank_name?: string | null
          completed_at?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          driving_school_id?: string | null
          failure_reason?: string | null
          id?: string
          instructor_id?: string | null
          mp_correlation_id?: string | null
          mp_payment_id?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          processed_at?: string | null
          receipt_url?: string | null
          requested_at?: string | null
          status?: string
          withdrawal_method?: string | null
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          account_type?: string | null
          amount?: number
          bank_name?: string | null
          completed_at?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          driving_school_id?: string | null
          failure_reason?: string | null
          id?: string
          instructor_id?: string | null
          mp_correlation_id?: string | null
          mp_payment_id?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          processed_at?: string | null
          receipt_url?: string | null
          requested_at?: string | null
          status?: string
          withdrawal_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_driving_school_id_fkey"
            columns: ["driving_school_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      accept_affiliation_invitation: {
        Args: { p_token: string }
        Returns: Json
      }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      check_email_exists:
        | {
            Args: { check_email: string }
            Returns: {
              affiliated_school_name: string
              exists_in_system: boolean
              full_name: string
              is_already_affiliated: boolean
              user_id: string
              user_type: string
            }[]
          }
        | {
            Args: { check_email: string; p_calling_school_id?: string }
            Returns: {
              affiliated_school_name: string
              affiliation_count: number
              exists_in_system: boolean
              full_name: string
              is_already_affiliated: boolean
              is_same_school: boolean
              user_id: string
              user_type: string
            }[]
          }
      cleanup_abandoned_accounts: { Args: never; Returns: number }
      clear_mock_data: { Args: never; Returns: undefined }
      create_mock_instructor_complete: {
        Args: {
          p_average_rating: number
          p_bio: string
          p_business_name: string
          p_city: string
          p_cpf: string
          p_email: string
          p_experience_years: number
          p_full_name: string
          p_is_driving_school: boolean
          p_latitude: number
          p_longitude: number
          p_neighborhood: string
          p_number: string
          p_phone: string
          p_state: string
          p_street: string
          p_total_reviews: number
          p_zipcode: string
        }
        Returns: string
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_affiliated_instructor_profile_ids: { Args: never; Returns: string[] }
      get_affiliation_info: {
        Args: { p_user_ids: string[] }
        Returns: {
          driving_school_id: string
          driving_school_logo: string
          driving_school_name: string
          is_affiliated: boolean
          user_id: string
        }[]
      }
      get_instructor_balance: {
        Args: { p_instructor_id: string }
        Returns: Json
      }
      get_instructor_stats: {
        Args: { p_instructor_id: string }
        Returns: {
          total_accepted: number
          total_completed: number
          total_rejected: number
        }[]
      }
      get_my_instructor_profile_id: { Args: never; Returns: string }
      get_or_create_conversation: {
        Args: { p_instructor_id: string; p_student_id: string }
        Returns: string
      }
      get_school_balance: {
        Args: { p_school_id: string }
        Returns: {
          next_release_amount: number
          next_release_date: string
          total_available: number
          total_pending: number
          total_withdrawn: number
        }[]
      }
      get_school_bookings: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_school_instructor_profile_id: string
        }
        Returns: {
          booking_id: string
          driving_school_instructor_id: string
          duration_hours: number
          end_time: string
          instructor_amount: number
          instructor_name: string
          license_category: string
          pickup_address: string
          scheduled_date: string
          school_fee: number
          start_time: string
          status: string
          student_name: string
          total_price: number
          vehicle_brand: string
          vehicle_model: string
        }[]
      }
      get_school_financial_summary: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_school_instructor_profile_id: string
        }
        Returns: {
          avg_class_price: number
          commission_rate: number
          completed_bookings: number
          fixed_fee: number
          instructor_dsi_id: string
          instructor_name: string
          total_bookings: number
          total_instructor_pay: number
          total_revenue: number
          total_school_fees: number
        }[]
      }
      get_withdrawal_methods: {
        Args: { p_owner_id: string; p_owner_type: string }
        Returns: {
          has_mp: boolean
          has_pix: boolean
          mp_email: string
          pix_key: string
          pix_key_type: string
        }[]
      }
      gettransactionid: { Args: never; Returns: unknown }
      has_completed_onboarding: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      instructor_has_booking_with_student: {
        Args: { student_user_id: string }
        Returns: boolean
      }
      instructor_has_booking_with_student_profile: {
        Args: { student_profile_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      longtransactionsenabled: { Args: never; Returns: boolean }
      nearby_driving_school_instructors: {
        Args: {
          max_results?: number
          radius_km?: number
          user_lat: number
          user_lng: number
        }
        Returns: {
          bio: string
          distance_km: number
          driving_school_id: string
          driving_school_logo: string
          driving_school_name: string
          id: string
          instructor_name: string
          latitude: number
          license_categories: string[]
          longitude: number
          phone: string
          photo_url: string
        }[]
      }
      nearby_instructors: {
        Args: {
          max_results?: number
          min_rating?: number
          radius_km?: number
          user_lat: number
          user_lng: number
        }
        Returns: {
          avatar_url: string
          average_rating: number
          bio: string
          categories: string[]
          distance_km: number
          full_name: string
          id: string
          is_online: boolean
          latitude: number
          longitude: number
          total_reviews: number
          user_id: string
        }[]
      }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      recalculate_pending_bookings_fees: {
        Args: {
          p_fee_fixed: number
          p_fee_percentage: number
          p_fee_type: string
        }
        Returns: number
      }
      release_available_funds: { Args: never; Returns: number }
      school_can_view_conversation: {
        Args: { conv_instructor_id: string }
        Returns: boolean
      }
      seed_mock_instructors: { Args: { p_quantity?: number }; Returns: Json }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      student_has_booking_with_instructor: {
        Args: { instructor_user_id: string }
        Returns: boolean
      }
      unlockrows: { Args: { "": string }; Returns: number }
      update_affiliated_vehicle: {
        Args: {
          p_adaptation_type?: string
          p_brand?: string
          p_color?: string
          p_has_air_conditioning?: boolean
          p_has_power_steering?: boolean
          p_is_active?: boolean
          p_is_adapted?: boolean
          p_license_category?: string
          p_license_plate?: string
          p_main_photo_url?: string
          p_model?: string
          p_transmission?: string
          p_vehicle_id: string
          p_vehicle_type?: string
          p_year?: number
        }
        Returns: Json
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      user_is_part_of_booking: {
        Args: { p_booking_id: string }
        Returns: boolean
      }
      user_is_part_of_conversation: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
      validate_withdrawal: {
        Args: { p_amount: number; p_owner_id: string; p_owner_type: string }
        Returns: {
          available_balance: number
          can_withdraw: boolean
          has_withdrawal_method: boolean
          reason: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator"
      user_type: "student" | "instructor" | "driving_school"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
      app_role: ["admin", "moderator"],
      user_type: ["student", "instructor", "driving_school"],
    },
  },
} as const
