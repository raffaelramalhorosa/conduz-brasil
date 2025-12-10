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
      bookings: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          duration_hours: number
          end_time: string
          id: string
          instructor_amount: number
          instructor_id: string
          instructor_message: string | null
          license_category: string
          pickup_address: string
          pickup_latitude: number | null
          pickup_longitude: number | null
          platform_fee: number
          price_per_hour: number
          requested_at: string | null
          scheduled_date: string
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
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          duration_hours?: number
          end_time: string
          id?: string
          instructor_amount?: number
          instructor_id: string
          instructor_message?: string | null
          license_category: string
          pickup_address: string
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          platform_fee?: number
          price_per_hour: number
          requested_at?: string | null
          scheduled_date: string
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
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          duration_hours?: number
          end_time?: string
          id?: string
          instructor_amount?: number
          instructor_id?: string
          instructor_message?: string | null
          license_category?: string
          pickup_address?: string
          pickup_latitude?: number | null
          pickup_longitude?: number | null
          platform_fee?: number
          price_per_hour?: number
          requested_at?: string | null
          scheduled_date?: string
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
          cpf: string | null
          created_at: string | null
          experience_years: number | null
          id: string
          instructor_license: string | null
          instructor_license_url: string | null
          is_active: boolean | null
          is_driving_school: boolean | null
          neighborhood: string | null
          number: string | null
          state: string | null
          street: string | null
          total_classes: number | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
          zipcode: string | null
        }
        Insert: {
          acceptance_rate?: number | null
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
          cpf?: string | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          instructor_license?: string | null
          instructor_license_url?: string | null
          is_active?: boolean | null
          is_driving_school?: boolean | null
          neighborhood?: string | null
          number?: string | null
          state?: string | null
          street?: string | null
          total_classes?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
          zipcode?: string | null
        }
        Update: {
          acceptance_rate?: number | null
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
          cpf?: string | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          instructor_license?: string | null
          instructor_license_url?: string | null
          is_active?: boolean | null
          is_driving_school?: boolean | null
          neighborhood?: string | null
          number?: string | null
          state?: string | null
          street?: string | null
          total_classes?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
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
      pricing: {
        Row: {
          created_at: string | null
          id: string
          instructor_id: string
          is_active: boolean | null
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
          id?: string
          instructor_id: string
          is_active?: boolean | null
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
          id?: string
          instructor_id?: string
          is_active?: boolean | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_type: "student" | "instructor" | "driving_school"
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
      user_type: ["student", "instructor", "driving_school"],
    },
  },
} as const
