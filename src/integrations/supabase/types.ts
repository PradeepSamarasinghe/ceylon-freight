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
      bookings: {
        Row: {
          agreed_price_lkr: number
          created_at: string
          driver_id: string
          id: string
          payment_method: string | null
          payment_status: string | null
          pod_photo_url: string | null
          pod_signature: string | null
          shipment_id: string
          status: string
          updated_at: string
        }
        Insert: {
          agreed_price_lkr: number
          created_at?: string
          driver_id: string
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          pod_photo_url?: string | null
          pod_signature?: string | null
          shipment_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          agreed_price_lkr?: number
          created_at?: string
          driver_id?: string
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          pod_photo_url?: string | null
          pod_signature?: string | null
          shipment_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          capacity_tons: number
          created_at: string
          current_district: string | null
          current_lat: number | null
          current_lng: number | null
          earnings_total_lkr: number | null
          id: string
          is_available: boolean | null
          is_online: boolean | null
          is_verified: boolean | null
          joined_at: string
          license_number: string | null
          name: string
          nic_number: string | null
          phone: string
          rating: number | null
          total_trips: number | null
          truck_registration: string | null
          truck_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          capacity_tons?: number
          created_at?: string
          current_district?: string | null
          current_lat?: number | null
          current_lng?: number | null
          earnings_total_lkr?: number | null
          id?: string
          is_available?: boolean | null
          is_online?: boolean | null
          is_verified?: boolean | null
          joined_at?: string
          license_number?: string | null
          name: string
          nic_number?: string | null
          phone: string
          rating?: number | null
          total_trips?: number | null
          truck_registration?: string | null
          truck_type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          capacity_tons?: number
          created_at?: string
          current_district?: string | null
          current_lat?: number | null
          current_lng?: number | null
          earnings_total_lkr?: number | null
          id?: string
          is_available?: boolean | null
          is_online?: boolean | null
          is_verified?: boolean | null
          joined_at?: string
          license_number?: string | null
          name?: string
          nic_number?: string | null
          phone?: string
          rating?: number | null
          total_trips?: number | null
          truck_registration?: string | null
          truck_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          shipment_id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          shipment_id: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          shipment_id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewer_type: string
          shipment_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewer_type: string
          shipment_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewer_type?: string
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      route_rates: {
        Row: {
          distance_km: number
          from_district: string
          id: string
          last_updated: string
          rate_large_lkr: number
          rate_medium_lkr: number
          rate_mini_lkr: number
          rate_semi_lkr: number
          to_district: string
        }
        Insert: {
          distance_km: number
          from_district: string
          id?: string
          last_updated?: string
          rate_large_lkr: number
          rate_medium_lkr: number
          rate_mini_lkr: number
          rate_semi_lkr: number
          to_district: string
        }
        Update: {
          distance_km?: number
          from_district?: string
          id?: string
          last_updated?: string
          rate_large_lkr?: number
          rate_medium_lkr?: number
          rate_mini_lkr?: number
          rate_semi_lkr?: number
          to_district?: string
        }
        Relationships: []
      }
      shipments: {
        Row: {
          ac_required: boolean | null
          cargo_description: string | null
          cargo_type: string
          cargo_value_lkr: number | null
          created_at: string
          delivered_at: string | null
          delivery_address: string | null
          delivery_district: string
          delivery_landmark: string | null
          dimensions_h: number | null
          dimensions_l: number | null
          dimensions_w: number | null
          driver_helper: boolean | null
          driver_id: string | null
          estimated_price_high: number | null
          estimated_price_low: number | null
          id: string
          load_type: string
          max_budget_lkr: number | null
          offered_price_lkr: number | null
          payment_method: string | null
          picked_up_at: string | null
          pickup_address: string | null
          pickup_date: string | null
          pickup_district: string
          pickup_landmark: string | null
          shipper_company: string | null
          shipper_name: string
          shipper_phone: string
          special_instructions: string | null
          status: string
          tail_lift_required: boolean | null
          tracking_lat: number | null
          tracking_lng: number | null
          truck_type: string
          updated_at: string
          user_id: string | null
          weight_kg: number
        }
        Insert: {
          ac_required?: boolean | null
          cargo_description?: string | null
          cargo_type: string
          cargo_value_lkr?: number | null
          created_at?: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_district: string
          delivery_landmark?: string | null
          dimensions_h?: number | null
          dimensions_l?: number | null
          dimensions_w?: number | null
          driver_helper?: boolean | null
          driver_id?: string | null
          estimated_price_high?: number | null
          estimated_price_low?: number | null
          id: string
          load_type?: string
          max_budget_lkr?: number | null
          offered_price_lkr?: number | null
          payment_method?: string | null
          picked_up_at?: string | null
          pickup_address?: string | null
          pickup_date?: string | null
          pickup_district: string
          pickup_landmark?: string | null
          shipper_company?: string | null
          shipper_name: string
          shipper_phone: string
          special_instructions?: string | null
          status?: string
          tail_lift_required?: boolean | null
          tracking_lat?: number | null
          tracking_lng?: number | null
          truck_type: string
          updated_at?: string
          user_id?: string | null
          weight_kg: number
        }
        Update: {
          ac_required?: boolean | null
          cargo_description?: string | null
          cargo_type?: string
          cargo_value_lkr?: number | null
          created_at?: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_district?: string
          delivery_landmark?: string | null
          dimensions_h?: number | null
          dimensions_l?: number | null
          dimensions_w?: number | null
          driver_helper?: boolean | null
          driver_id?: string | null
          estimated_price_high?: number | null
          estimated_price_low?: number | null
          id?: string
          load_type?: string
          max_budget_lkr?: number | null
          offered_price_lkr?: number | null
          payment_method?: string | null
          picked_up_at?: string | null
          pickup_address?: string | null
          pickup_date?: string | null
          pickup_district?: string
          pickup_landmark?: string | null
          shipper_company?: string | null
          shipper_name?: string
          shipper_phone?: string
          special_instructions?: string | null
          status?: string
          tail_lift_required?: boolean | null
          tracking_lat?: number | null
          tracking_lng?: number | null
          truck_type?: string
          updated_at?: string
          user_id?: string | null
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "shipments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "shipper" | "driver"
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
      app_role: ["shipper", "driver"],
    },
  },
} as const
