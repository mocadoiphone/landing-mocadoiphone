export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string
          created_by: string | null
          display_name: string
          is_active: boolean
          role: Database["public"]["Enums"]["admin_role"]
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_name: string
          is_active?: boolean
          role: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_name?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["admin_role"]
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          actor_role: Database["public"]["Enums"]["admin_role"] | null
          actor_user_id: string | null
          changed_fields: string[] | null
          created_at: string
          entity_id: string
          entity_type: string
          id: number
          new_value: Json | null
          old_value: Json | null
          operation: Database["public"]["Enums"]["audit_operation"]
          source: string
        }
        Insert: {
          actor_role?: Database["public"]["Enums"]["admin_role"] | null
          actor_user_id?: string | null
          changed_fields?: string[] | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: never
          new_value?: Json | null
          old_value?: Json | null
          operation: Database["public"]["Enums"]["audit_operation"]
          source: string
        }
        Update: {
          actor_role?: Database["public"]["Enums"]["admin_role"] | null
          actor_user_id?: string | null
          changed_fields?: string[] | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: never
          new_value?: Json | null
          old_value?: Json | null
          operation?: Database["public"]["Enums"]["audit_operation"]
          source?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: string
          image_asset_id: string | null
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          image_asset_id?: string | null
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          image_asset_id?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_image_asset_id_fkey"
            columns: ["image_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          avatar_asset_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          phone: string | null
          role: string | null
          sort_order: number
          updated_at: string
          updated_by: string | null
          whatsapp: string
        }
        Insert: {
          avatar_asset_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          phone?: string | null
          role?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          whatsapp: string
        }
        Update: {
          avatar_asset_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          phone?: string | null
          role?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_avatar_asset_id_fkey"
            columns: ["avatar_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_sections: {
        Row: {
          category_id: string | null
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          media_asset_id: string | null
          product_id: string | null
          settings_json: Json
          sort_order: number
          subtitle: string | null
          theme: Database["public"]["Enums"]["section_theme"]
          title: string | null
          type: Database["public"]["Enums"]["content_block_type"]
          updated_at: string
          updated_by: string | null
          video_asset_id: string | null
        }
        Insert: {
          category_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          media_asset_id?: string | null
          product_id?: string | null
          settings_json?: Json
          sort_order?: number
          subtitle?: string | null
          theme?: Database["public"]["Enums"]["section_theme"]
          title?: string | null
          type: Database["public"]["Enums"]["content_block_type"]
          updated_at?: string
          updated_by?: string | null
          video_asset_id?: string | null
        }
        Update: {
          category_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          media_asset_id?: string | null
          product_id?: string | null
          settings_json?: Json
          sort_order?: number
          subtitle?: string | null
          theme?: Database["public"]["Enums"]["section_theme"]
          title?: string | null
          type?: Database["public"]["Enums"]["content_block_type"]
          updated_at?: string
          updated_by?: string | null
          video_asset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homepage_sections_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homepage_sections_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homepage_sections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homepage_sections_video_asset_id_fkey"
            columns: ["video_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string
          bucket_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          mime_type: string
          size_bytes: number
          storage_path: string
          updated_at: string
          updated_by: string | null
          width: number | null
        }
        Insert: {
          alt_text: string
          bucket_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          height?: number | null
          id?: string
          kind: Database["public"]["Enums"]["media_kind"]
          mime_type: string
          size_bytes: number
          storage_path: string
          updated_at?: string
          updated_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string
          bucket_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          mime_type?: string
          size_bytes?: number
          storage_path?: string
          updated_at?: string
          updated_by?: string | null
          width?: number | null
        }
        Relationships: []
      }
      product_families: {
        Row: {
          category_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_families_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_media: {
        Row: {
          alt_text: string | null
          created_at: string
          created_by: string | null
          id: string
          media_asset_id: string
          product_id: string
          slot: string
          sort_order: number
          updated_at: string
          updated_by: string | null
          variant_id: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          media_asset_id: string
          product_id: string
          slot: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          variant_id?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          media_asset_id?: string
          product_id?: string
          slot?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_media_media_asset_id_fkey"
            columns: ["media_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_media_variant_belongs_to_product"
            columns: ["variant_id", "product_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id", "product_id"]
          },
        ]
      }
      product_specs: {
        Row: {
          created_at: string
          created_by: string | null
          group_name: string | null
          id: string
          label: string
          product_id: string
          sort_order: number
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          group_name?: string | null
          id?: string
          label: string
          product_id: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          group_name?: string | null
          id?: string
          label?: string
          product_id?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_specs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          availability: Database["public"]["Enums"]["availability_status"]
          color_hex: string | null
          color_name: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          installment_text: string | null
          installments: number | null
          is_default: boolean
          price_cash: number | null
          price_installment: number | null
          price_old: number | null
          price_on_request: boolean
          product_id: string
          sku: string | null
          sort_order: number
          storage: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          availability?: Database["public"]["Enums"]["availability_status"]
          color_hex?: string | null
          color_name?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          installment_text?: string | null
          installments?: number | null
          is_default?: boolean
          price_cash?: number | null
          price_installment?: number | null
          price_old?: number | null
          price_on_request?: boolean
          product_id: string
          sku?: string | null
          sort_order?: number
          storage?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          availability?: Database["public"]["Enums"]["availability_status"]
          color_hex?: string | null
          color_name?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          installment_text?: string | null
          installments?: number | null
          is_default?: boolean
          price_cash?: number | null
          price_installment?: number | null
          price_old?: number | null
          price_on_request?: boolean
          product_id?: string
          sku?: string | null
          sort_order?: number
          storage?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          badge: string | null
          canonical_url: string | null
          category_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          family_id: string
          id: string
          is_featured: boolean
          is_launch: boolean
          is_promotion: boolean
          meta_description: string | null
          meta_title: string | null
          name: string
          og_image_asset_id: string | null
          price_from: number | null
          published_at: string | null
          related_product_id: string | null
          short_description: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["publication_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          badge?: string | null
          canonical_url?: string | null
          category_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          family_id: string
          id?: string
          is_featured?: boolean
          is_launch?: boolean
          is_promotion?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name: string
          og_image_asset_id?: string | null
          price_from?: number | null
          published_at?: string | null
          related_product_id?: string | null
          short_description?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          badge?: string | null
          canonical_url?: string | null
          category_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          family_id?: string
          id?: string
          is_featured?: boolean
          is_launch?: boolean
          is_promotion?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          og_image_asset_id?: string | null
          price_from?: number | null
          published_at?: string | null
          related_product_id?: string | null
          short_description?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_family_matches_category"
            columns: ["family_id", "category_id"]
            isOneToOne: false
            referencedRelation: "product_families"
            referencedColumns: ["id", "category_id"]
          },
          {
            foreignKeyName: "products_og_image_asset_id_fkey"
            columns: ["og_image_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          created_by: string | null
          is_public: boolean | null
          key: string
          updated_at: string
          updated_by: string | null
          value_json: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          is_public?: boolean | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value_json?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          is_public?: boolean | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value_json?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      grant_admin_profile: {
        Args: {
          p_display_name: string
          p_email: string
          p_role: Database["public"]["Enums"]["admin_role"]
        }
        Returns: string
      }
      list_admin_users: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          is_active: boolean
          last_sign_in_at: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }[]
      }
      set_default_contact: {
        Args: { p_contact_id: string }
        Returns: undefined
      }
      set_default_variant: {
        Args: { p_variant_id: string }
        Returns: undefined
      }
    }
    Enums: {
      admin_role: "OWNER" | "ADMIN" | "CATALOG_MANAGER" | "CONTENT_EDITOR"
      audit_operation:
        | "INSERT"
        | "UPDATE"
        | "DELETE"
        | "SOFT_DELETE"
        | "RESTORE"
        | "PUBLISH"
        | "UNPUBLISH"
      availability_status:
        | "AVAILABLE"
        | "PRE_ORDER"
        | "ON_REQUEST"
        | "OUT_OF_STOCK"
        | "DISCONTINUED"
        | "HIDDEN"
      content_block_type:
        | "HERO_PRODUCT"
        | "PRODUCT_STORY"
        | "PRODUCT_GRID"
        | "CATEGORY_GRID"
        | "FULLSCREEN_MEDIA"
        | "TEXT_AND_MEDIA"
        | "FEATURES"
        | "PROMO_BANNER"
        | "STORE"
        | "REVIEWS"
        | "CTA"
      media_kind: "IMAGE" | "VIDEO"
      publication_status: "DRAFT" | "REVIEWED" | "PUBLISHED"
      section_theme: "LIGHT" | "DARK"
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
      admin_role: ["OWNER", "ADMIN", "CATALOG_MANAGER", "CONTENT_EDITOR"],
      audit_operation: [
        "INSERT",
        "UPDATE",
        "DELETE",
        "SOFT_DELETE",
        "RESTORE",
        "PUBLISH",
        "UNPUBLISH",
      ],
      availability_status: [
        "AVAILABLE",
        "PRE_ORDER",
        "ON_REQUEST",
        "OUT_OF_STOCK",
        "DISCONTINUED",
        "HIDDEN",
      ],
      content_block_type: [
        "HERO_PRODUCT",
        "PRODUCT_STORY",
        "PRODUCT_GRID",
        "CATEGORY_GRID",
        "FULLSCREEN_MEDIA",
        "TEXT_AND_MEDIA",
        "FEATURES",
        "PROMO_BANNER",
        "STORE",
        "REVIEWS",
        "CTA",
      ],
      media_kind: ["IMAGE", "VIDEO"],
      publication_status: ["DRAFT", "REVIEWED", "PUBLISHED"],
      section_theme: ["LIGHT", "DARK"],
    },
  },
} as const

