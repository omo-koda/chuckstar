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
      cart_items: {
        Row: {
          collectible_id: string
          created_at: string
          id: string
          qty: number
          user_id: string
        }
        Insert: {
          collectible_id: string
          created_at?: string
          id?: string
          qty?: number
          user_id: string
        }
        Update: {
          collectible_id?: string
          created_at?: string
          id?: string
          qty?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_collectible_id_fkey"
            columns: ["collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          gradient: string | null
          icon_key: string | null
          id: string
          image_url: string | null
          item_count: string | null
          slug: string
          sort_order: number
          subtitle: string | null
          title: string
        }
        Insert: {
          created_at?: string
          gradient?: string | null
          icon_key?: string | null
          id?: string
          image_url?: string | null
          item_count?: string | null
          slug: string
          sort_order?: number
          subtitle?: string | null
          title: string
        }
        Update: {
          created_at?: string
          gradient?: string | null
          icon_key?: string | null
          id?: string
          image_url?: string | null
          item_count?: string | null
          slug?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
        }
        Relationships: []
      }
      collectibles: {
        Row: {
          badge: string | null
          badge_color: string | null
          category: string
          created_at: string
          end_time: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          likes: number
          name: string
          price_cents: number
          remaining: number
          slug: string
          total: number
          views: number
        }
        Insert: {
          badge?: string | null
          badge_color?: string | null
          category: string
          created_at?: string
          end_time?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          likes?: number
          name: string
          price_cents?: number
          remaining?: number
          slug: string
          total?: number
          views?: number
        }
        Update: {
          badge?: string | null
          badge_color?: string | null
          category?: string
          created_at?: string
          end_time?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          likes?: number
          name?: string
          price_cents?: number
          remaining?: number
          slug?: string
          total?: number
          views?: number
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          attendees: string | null
          created_at: string
          event_date: string
          id: string
          location: string | null
          sort_order: number
          status: string | null
          title: string
        }
        Insert: {
          attendees?: string | null
          created_at?: string
          event_date: string
          id?: string
          location?: string | null
          sort_order?: number
          status?: string | null
          title: string
        }
        Update: {
          attendees?: string | null
          created_at?: string
          event_date?: string
          id?: string
          location?: string | null
          sort_order?: number
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          collectible_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          collectible_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          collectible_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_collectible_id_fkey"
            columns: ["collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      presence: {
        Row: {
          last_seen: string
          session_id: string
        }
        Insert: {
          last_seen?: string
          session_id: string
        }
        Update: {
          last_seen?: string
          session_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          approved: boolean
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          quote: string
          rating: number
          result: string | null
          role: string | null
          sort_order: number
        }
        Insert: {
          approved?: boolean
          avatar_url?: string | null
          created_at?: string
          id?: string
          name: string
          quote: string
          rating?: number
          result?: string | null
          role?: string | null
          sort_order?: number
        }
        Update: {
          approved?: boolean
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          quote?: string
          rating?: number
          result?: string | null
          role?: string | null
          sort_order?: number
        }
        Relationships: []
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
