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
      account_deletion_requests: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          prepared_at: string | null
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          prepared_at?: string | null
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          prepared_at?: string | null
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address_line: string
          created_at: string
          customer_id: string
          district: string
          id: string
          is_default: boolean
          label: string
          latitude: number | null
          longitude: number | null
          reference: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          address_line: string
          created_at?: string
          customer_id: string
          district: string
          id?: string
          is_default?: boolean
          label?: string
          latitude?: number | null
          longitude?: number | null
          reference?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          address_line?: string
          created_at?: string
          customer_id?: string
          district?: string
          id?: string
          is_default?: boolean
          label?: string
          latitude?: number | null
          longitude?: number | null
          reference?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_store_id_customer_id_fkey"
            columns: ["store_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["store_id", "id"]
          },
          {
            foreignKeyName: "customer_addresses_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_preferences: {
        Row: {
          customer_id: string
          marketing_consent: boolean
          order_notifications: boolean
          promotion_notifications: boolean
          store_id: string
          substitution_default: string
          updated_at: string
        }
        Insert: {
          customer_id: string
          marketing_consent?: boolean
          order_notifications?: boolean
          promotion_notifications?: boolean
          store_id: string
          substitution_default?: string
          updated_at?: string
        }
        Update: {
          customer_id?: string
          marketing_consent?: boolean
          order_notifications?: boolean
          promotion_notifications?: boolean
          store_id?: string
          substitution_default?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_preferences_store_id_customer_id_fkey"
            columns: ["store_id", "customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["store_id", "id"]
          },
        ]
      }
      customers: {
        Row: {
          auth_user_id: string | null
          cash_pickup_restricted_until: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          phone_verified_at: string | null
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          cash_pickup_restricted_until?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          phone_verified_at?: string | null
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          cash_pickup_restricted_until?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          phone_verified_at?: string | null
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_assignments: {
        Row: {
          assigned_at: string
          confirmation_code_hash: string | null
          created_at: string
          delivered_at: string | null
          driver_user_id: string | null
          evidence_storage_path: string | null
          id: string
          notes: string | null
          order_id: string
          recipient_name: string | null
          started_at: string | null
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          confirmation_code_hash?: string | null
          created_at?: string
          delivered_at?: string | null
          driver_user_id?: string | null
          evidence_storage_path?: string | null
          id?: string
          notes?: string | null
          order_id: string
          recipient_name?: string | null
          started_at?: string | null
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          confirmation_code_hash?: string | null
          created_at?: string
          delivered_at?: string | null
          driver_user_id?: string | null
          evidence_storage_path?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          recipient_name?: string | null
          started_at?: string | null
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_assignments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_store_id_order_id_fkey"
            columns: ["store_id", "order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["store_id", "id"]
          },
        ]
      }
      delivery_events: {
        Row: {
          actor_user_id: string | null
          assignment_id: string
          created_at: string
          event_type: string
          id: string
          latitude: number | null
          longitude: number | null
          note: string | null
          store_id: string
        }
        Insert: {
          actor_user_id?: string | null
          assignment_id: string
          created_at?: string
          event_type: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          note?: string | null
          store_id: string
        }
        Update: {
          actor_user_id?: string | null
          assignment_id?: string
          created_at?: string
          event_type?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          note?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_events_store_id_assignment_id_fkey"
            columns: ["store_id", "assignment_id"]
            isOneToOne: false
            referencedRelation: "delivery_assignments"
            referencedColumns: ["store_id", "id"]
          },
          {
            foreignKeyName: "delivery_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          created_at: string
          district: string
          eta_max_minutes: number | null
          eta_min_minutes: number | null
          fee_cents: number
          id: string
          is_active: boolean
          minimum_order_cents: number
          name: string
          restrictions: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          district: string
          eta_max_minutes?: number | null
          eta_min_minutes?: number | null
          fee_cents: number
          id?: string
          is_active?: boolean
          minimum_order_cents?: number
          name: string
          restrictions?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          district?: string
          eta_max_minutes?: number | null
          eta_min_minutes?: number | null
          fee_cents?: number
          id?: string
          is_active?: boolean
          minimum_order_cents?: number
          name?: string
          restrictions?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_lot_packages: {
        Row: {
          created_at: string
          id: string
          lot_id: string
          presentation_id: string
          sealed_on_hand_units: number
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lot_id: string
          presentation_id: string
          sealed_on_hand_units?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lot_id?: string
          presentation_id?: string
          sealed_on_hand_units?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_lot_packages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lot_packages_store_id_lot_id_fkey"
            columns: ["store_id", "lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["store_id", "id"]
          },
          {
            foreignKeyName: "inventory_lot_packages_store_id_presentation_id_fkey"
            columns: ["store_id", "presentation_id"]
            isOneToOne: false
            referencedRelation: "product_presentations"
            referencedColumns: ["store_id", "id"]
          },
        ]
      }
      inventory_lots: {
        Row: {
          created_at: string
          created_by: string | null
          expires_on: string | null
          id: string
          loose_on_hand_quantity: number
          lot_code: string
          notes: string | null
          product_id: string
          received_at: string
          status: string
          store_id: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_on?: string | null
          id?: string
          loose_on_hand_quantity?: number
          lot_code: string
          notes?: string | null
          product_id: string
          received_at?: string
          status?: string
          store_id: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_on?: string | null
          id?: string
          loose_on_hand_quantity?: number
          lot_code?: string
          notes?: string | null
          product_id?: string
          received_at?: string
          status?: string
          store_id?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_lots_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lots_store_id_product_id_fkey"
            columns: ["store_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["store_id", "id"]
          },
          {
            foreignKeyName: "inventory_lots_store_id_supplier_id_fkey"
            columns: ["store_id", "supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["store_id", "id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          actor_user_id: string | null
          base_quantity_delta: number
          created_at: string
          id: string
          loose_quantity_delta: number
          lot_id: string
          movement_type: string
          operation_id: string
          presentation_id: string | null
          product_id: string
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          sealed_units_delta: number
          store_id: string
        }
        Insert: {
          actor_user_id?: string | null
          base_quantity_delta: number
          created_at?: string
          id?: string
          loose_quantity_delta?: number
          lot_id: string
          movement_type: string
          operation_id: string
          presentation_id?: string | null
          product_id: string
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          sealed_units_delta?: number
          store_id: string
        }
        Update: {
          actor_user_id?: string | null
          base_quantity_delta?: number
          created_at?: string
          id?: string
          loose_quantity_delta?: number
          lot_id?: string
          movement_type?: string
          operation_id?: string
          presentation_id?: string | null
          product_id?: string
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          sealed_units_delta?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_store_id_lot_id_fkey"
            columns: ["store_id", "lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["store_id", "id"]
          },
          {
            foreignKeyName: "inventory_movements_store_id_presentation_id_product_id_fkey"
            columns: ["store_id", "presentation_id", "product_id"]
            isOneToOne: false
            referencedRelation: "product_presentations"
            referencedColumns: ["store_id", "id", "product_id"]
          },
          {
            foreignKeyName: "inventory_movements_store_id_product_id_fkey"
            columns: ["store_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["store_id", "id"]
          },
        ]
      }
      inventory_reservation_allocations: {
        Row: {
          allocated_base_quantity: number
          allocated_package_units: number
          created_at: string
          id: string
          lot_id: string
          package_presentation_id: string | null
          reservation_id: string
          store_id: string
        }
        Insert: {
          allocated_base_quantity: number
          allocated_package_units?: number
          created_at?: string
          id?: string
          lot_id: string
          package_presentation_id?: string | null
          reservation_id: string
          store_id: string
        }
        Update: {
          allocated_base_quantity?: number
          allocated_package_units?: number
          created_at?: string
          id?: string
          lot_id?: string
          package_presentation_id?: string | null
          reservation_id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reservation_allocat_store_id_package_presentatio_fkey"
            columns: ["store_id", "package_presentation_id"]
            isOneToOne: false
            referencedRelation: "product_presentations"
            referencedColumns: ["store_id", "id"]
          },
          {
            foreignKeyName: "inventory_reservation_allocations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservation_allocations_store_id_lot_id_fkey"
            columns: ["store_id", "lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["store_id", "id"]
          },
          {
            foreignKeyName: "inventory_reservation_allocations_store_id_reservation_id_fkey"
            columns: ["store_id", "reservation_id"]
            isOneToOne: false
            referencedRelation: "inventory_reservations"
            referencedColumns: ["store_id", "id"]
          },
        ]
      }
      inventory_reservations: {
        Row: {
          consumed_at: string | null
          consumed_quantity: number
          created_at: string
          expires_at: string
          id: string
          order_id: string
          order_item_id: string
          product_id: string
          released_at: string | null
          reserved_quantity: number
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          consumed_at?: string | null
          consumed_quantity?: number
          created_at?: string
          expires_at: string
          id?: string
          order_id: string
          order_item_id: string
          product_id: string
          released_at?: string | null
          reserved_quantity: number
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          consumed_at?: string | null
          consumed_quantity?: number
          created_at?: string
          expires_at?: string
          id?: string
          order_id?: string
          order_item_id?: string
          product_id?: string
          released_at?: string | null
          reserved_quantity?: number
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reservations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservations_store_id_order_id_fkey"
            columns: ["store_id", "order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["store_id", "id"]
          },
          {
            foreignKeyName: "inventory_reservations_store_id_order_item_id_order_id_fkey"
            columns: ["store_id", "order_item_id", "order_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["store_id", "id", "order_id"]
          },
          {
            foreignKeyName: "inventory_reservations_store_id_product_id_fkey"
            columns: ["store_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["store_id", "id"]
          },
        ]
      }
      order_items: {
        Row: {
          base_unit_snapshot: string
          created_at: string
          estimated_discount_cents: number
          estimated_line_cents: number
          estimated_quantity: number
          final_discount_cents: number | null
          final_line_cents: number | null
          id: string
          max_substitution_extra_cents: number
          order_id: string
          prepared_quantity: number | null
          presentation_id: string
          presentation_name_snapshot: string
          price_cents_snapshot: number
          pricing_quantity_snapshot: number
          product_id: string
          product_name_snapshot: string
          request_mode: string
          requested_money_cents: number | null
          requested_quantity: number | null
          store_id: string
          substitution_policy: string
          updated_at: string
        }
        Insert: {
          base_unit_snapshot: string
          created_at?: string
          estimated_discount_cents?: number
          estimated_line_cents: number
          estimated_quantity: number
          final_discount_cents?: number | null
          final_line_cents?: number | null
          id?: string
          max_substitution_extra_cents?: number
          order_id: string
          prepared_quantity?: number | null
          presentation_id: string
          presentation_name_snapshot: string
          price_cents_snapshot: number
          pricing_quantity_snapshot: number
          product_id: string
          product_name_snapshot: string
          request_mode: string
          requested_money_cents?: number | null
          requested_quantity?: number | null
          store_id: string
          substitution_policy?: string
          updated_at?: string
        }
        Update: {
          base_unit_snapshot?: string
          created_at?: string
          estimated_discount_cents?: number
          estimated_line_cents?: number
          estimated_quantity?: number
          final_discount_cents?: number | null
          final_line_cents?: number | null
          id?: string
          max_substitution_extra_cents?: number
          order_id?: string
          prepared_quantity?: number | null
          presentation_id?: string
          presentation_name_snapshot?: string
          price_cents_snapshot?: number
          pricing_quantity_snapshot?: number
          product_id?: string
          product_name_snapshot?: string
          request_mode?: string
          requested_money_cents?: number | null
          requested_quantity?: number | null
          store_id?: string
          substitution_policy?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_store_id_order_id_fkey"
            columns: ["store_id", "order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["store_id", "id"]
          },
          {
            foreignKeyName: "order_items_store_id_presentation_id_product_id_fkey"
            columns: ["store_id", "presentation_id", "product_id"]
            isOneToOne: false
            referencedRelation: "product_presentations"
            referencedColumns: ["store_id", "id", "product_id"]
          },
          {
            foreignKeyName: "order_items_store_id_product_id_fkey"
            columns: ["store_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["store_id", "id"]
          },
        ]
      }
      order_promotions: {
        Row: {
          coupon_code_snapshot: string | null
          created_at: string
          discount_cents: number
          id: string
          order_id: string
          order_item_id: string | null
          promotion_id: string
          promotion_name_snapshot: string
          store_id: string
        }
        Insert: {
          coupon_code_snapshot?: string | null
          created_at?: string
          discount_cents: number
          id?: string
          order_id: string
          order_item_id?: string | null
          promotion_id: string
          promotion_name_snapshot: string
          store_id: string
        }
        Update: {
          coupon_code_snapshot?: string | null
          created_at?: string
          discount_cents?: number
          id?: string
          order_id?: string
          order_item_id?: string | null
          promotion_id?: string
          promotion_name_snapshot?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_promotions_store_id_order_id_fkey"
            columns: ["store_id", "order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["store_id", "id"]
          },
          {
            foreignKeyName: "order_promotions_store_id_order_item_id_order_id_fkey"
            columns: ["store_id", "order_item_id", "order_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["store_id", "id", "order_id"]
          },
          {
            foreignKeyName: "order_promotions_store_id_promotion_id_fkey"
            columns: ["store_id", "promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["store_id", "id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          actor_user_id: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          operation_id: string
          order_id: string
          reason_code: string | null
          store_id: string
          to_status: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          operation_id: string
          order_id: string
          reason_code?: string | null
          store_id: string
          to_status: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          operation_id?: string
          order_id?: string
          reason_code?: string | null
          store_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_store_id_order_id_fkey"
            columns: ["store_id", "order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["store_id", "id"]
          },
        ]
      }
      order_substitutions: {
        Row: {
          created_at: string
          decided_at: string | null
          expires_at: string | null
          id: string
          order_id: string
          order_item_id: string
          price_difference_cents: number
          proposed_by: string | null
          proposed_line_cents: number
          proposed_quantity: number
          replacement_presentation_id: string
          replacement_product_id: string
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          expires_at?: string | null
          id?: string
          order_id: string
          order_item_id: string
          price_difference_cents: number
          proposed_by?: string | null
          proposed_line_cents: number
          proposed_quantity: number
          replacement_presentation_id: string
          replacement_product_id: string
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          expires_at?: string | null
          id?: string
          order_id?: string
          order_item_id?: string
          price_difference_cents?: number
          proposed_by?: string | null
          proposed_line_cents?: number
          proposed_quantity?: number
          replacement_presentation_id?: string
          replacement_product_id?: string
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_substitutions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_substitutions_store_id_order_id_fkey"
            columns: ["store_id", "order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["store_id", "id"]
          },
          {
            foreignKeyName: "order_substitutions_store_id_order_item_id_order_id_fkey"
            columns: ["store_id", "order_item_id", "order_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["store_id", "id", "order_id"]
          },
          {
            foreignKeyName: "order_substitutions_store_id_replacement_presentation_id_fkey"
            columns: ["store_id", "replacement_presentation_id"]
            isOneToOne: false
            referencedRelation: "product_presentations"
            referencedColumns: ["store_id", "id"]
          },
          {
            foreignKeyName: "order_substitutions_store_id_replacement_product_id_fkey"
            columns: ["store_id", "replacement_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["store_id", "id"]
          },
        ]
      }
      orders: {
        Row: {
          cancellation_reason_code: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          customer_email: string | null
          customer_id: string
          customer_name: string
          customer_phone: string
          delivery_address: Json | null
          delivery_discount_cents: number
          delivery_fee_cents: number
          delivery_zone_id: string | null
          estimated_discount_cents: number
          estimated_ready_at: string | null
          estimated_subtotal_cents: number
          estimated_total_cents: number
          final_discount_cents: number | null
          final_subtotal_cents: number | null
          final_total_cents: number | null
          fulfillment_type: string
          id: string
          notes: string | null
          operation_id: string
          order_number: string
          payment_due_at: string | null
          payment_instructions: Json | null
          payment_method: string
          payment_status: string
          pickup_confirmation_code_hash: string | null
          preparation_not_before: string | null
          requester_user_id: string | null
          scheduled_for: string | null
          source: string
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          cancellation_reason_code?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id: string
          customer_name: string
          customer_phone: string
          delivery_address?: Json | null
          delivery_discount_cents?: number
          delivery_fee_cents?: number
          delivery_zone_id?: string | null
          estimated_discount_cents?: number
          estimated_ready_at?: string | null
          estimated_subtotal_cents: number
          estimated_total_cents: number
          final_discount_cents?: number | null
          final_subtotal_cents?: number | null
          final_total_cents?: number | null
          fulfillment_type: string
          id?: string
          notes?: string | null
          operation_id: string
          order_number: string
          payment_due_at?: string | null
          payment_instructions?: Json | null
          payment_method: string
          payment_status?: string
          pickup_confirmation_code_hash?: string | null
          preparation_not_before?: string | null
          requester_user_id?: string | null
          scheduled_for?: string | null
          source: string
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          cancellation_reason_code?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string
          customer_name?: string
          customer_phone?: string
          delivery_address?: Json | null
          delivery_discount_cents?: number
          delivery_fee_cents?: number
          delivery_zone_id?: string | null
          estimated_discount_cents?: number
          estimated_ready_at?: string | null
          estimated_subtotal_cents?: number
          estimated_total_cents?: number
          final_discount_cents?: number | null
          final_subtotal_cents?: number | null
          final_total_cents?: number | null
          fulfillment_type?: string
          id?: string
          notes?: string | null
          operation_id?: string
          order_number?: string
          payment_due_at?: string | null
          payment_instructions?: Json | null
          payment_method?: string
          payment_status?: string
          pickup_confirmation_code_hash?: string | null
          preparation_not_before?: string | null
          requester_user_id?: string | null
          scheduled_for?: string | null
          source?: string
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_customer_id_fkey"
            columns: ["store_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["store_id", "id"]
          },
          {
            foreignKeyName: "orders_store_id_delivery_zone_id_fkey"
            columns: ["store_id", "delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["store_id", "id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          legal_name: string | null
          name: string
          status: string
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          legal_name?: string | null
          name: string
          status?: string
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          legal_name?: string | null
          name?: string
          status?: string
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          processing_error: string | null
          provider: string
          provider_event_id: string
          received_at: string
          signature_valid: boolean
        }
        Insert: {
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_error?: string | null
          provider: string
          provider_event_id: string
          received_at?: string
          signature_valid: boolean
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_error?: string | null
          provider?: string
          provider_event_id?: string
          received_at?: string
          signature_valid?: boolean
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          customer_payment_reference: string | null
          failure_code: string | null
          failure_message: string | null
          id: string
          idempotency_key: string
          method: string
          order_id: string
          parent_transaction_id: string | null
          processed_at: string | null
          proof_storage_path: string | null
          provider: string
          provider_reference: string | null
          status: string
          store_id: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          customer_payment_reference?: string | null
          failure_code?: string | null
          failure_message?: string | null
          id?: string
          idempotency_key: string
          method: string
          order_id: string
          parent_transaction_id?: string | null
          processed_at?: string | null
          proof_storage_path?: string | null
          provider: string
          provider_reference?: string | null
          status: string
          store_id: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          customer_payment_reference?: string | null
          failure_code?: string | null
          failure_message?: string | null
          id?: string
          idempotency_key?: string
          method?: string
          order_id?: string
          parent_transaction_id?: string | null
          processed_at?: string | null
          proof_storage_path?: string | null
          provider?: string
          provider_reference?: string | null
          status?: string
          store_id?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_store_id_order_id_fkey"
            columns: ["store_id", "order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["store_id", "id"]
          },
          {
            foreignKeyName: "payment_transactions_store_id_parent_transaction_id_fkey"
            columns: ["store_id", "parent_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["store_id", "id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          product_id: string
          sort_order: number
          storage_path: string
          store_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
          storage_path: string
          store_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
          storage_path?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_store_id_product_id_fkey"
            columns: ["store_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["store_id", "id"]
          },
        ]
      }
      product_presentations: {
        Row: {
          allows_money_input: boolean
          allows_quantity_input: boolean
          base_quantity: number
          created_at: string
          id: string
          is_active: boolean
          is_sealed: boolean
          kind: string
          minimum_quantity: number
          name: string
          price_cents: number
          price_mode: string
          product_id: string
          quantity_step: number
          sku: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          allows_money_input?: boolean
          allows_quantity_input?: boolean
          base_quantity: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_sealed?: boolean
          kind: string
          minimum_quantity?: number
          name: string
          price_cents: number
          price_mode: string
          product_id: string
          quantity_step?: number
          sku?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          allows_money_input?: boolean
          allows_quantity_input?: boolean
          base_quantity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_sealed?: boolean
          kind?: string
          minimum_quantity?: number
          name?: string
          price_cents?: number
          price_mode?: string
          product_id?: string
          quantity_step?: number
          sku?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_presentations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_presentations_store_id_product_id_fkey"
            columns: ["store_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["store_id", "id"]
          },
        ]
      }
      product_price_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_price_cents: number
          old_price_cents: number | null
          presentation_id: string
          reason: string | null
          store_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_price_cents: number
          old_price_cents?: number | null
          presentation_id: string
          reason?: string | null
          store_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_price_cents?: number
          old_price_cents?: number | null
          presentation_id?: string
          reason?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_price_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_price_history_store_id_presentation_id_fkey"
            columns: ["store_id", "presentation_id"]
            isOneToOne: false
            referencedRelation: "product_presentations"
            referencedColumns: ["store_id", "id"]
          },
        ]
      }
      products: {
        Row: {
          base_unit: string
          brand: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          minimum_stock_quantity: number
          name: string
          sku: string | null
          store_id: string
          tracks_expiration: boolean
          updated_at: string
        }
        Insert: {
          base_unit: string
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          minimum_stock_quantity?: number
          name: string
          sku?: string | null
          store_id: string
          tracks_expiration?: boolean
          updated_at?: string
        }
        Update: {
          base_unit?: string
          brand?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          minimum_stock_quantity?: number
          name?: string
          sku?: string | null
          store_id?: string
          tracks_expiration?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_category_id_fkey"
            columns: ["store_id", "category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["store_id", "id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      promotion_products: {
        Row: {
          id: string
          presentation_id: string | null
          product_id: string
          promotion_id: string
          store_id: string
        }
        Insert: {
          id?: string
          presentation_id?: string | null
          product_id: string
          promotion_id: string
          store_id: string
        }
        Update: {
          id?: string
          presentation_id?: string | null
          product_id?: string
          promotion_id?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_products_store_id_presentation_id_product_id_fkey"
            columns: ["store_id", "presentation_id", "product_id"]
            isOneToOne: false
            referencedRelation: "product_presentations"
            referencedColumns: ["store_id", "id", "product_id"]
          },
          {
            foreignKeyName: "promotion_products_store_id_product_id_fkey"
            columns: ["store_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["store_id", "id"]
          },
          {
            foreignKeyName: "promotion_products_store_id_promotion_id_fkey"
            columns: ["store_id", "promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["store_id", "id"]
          },
        ]
      }
      promotions: {
        Row: {
          coupon_code: string | null
          created_at: string
          description: string | null
          ends_at: string
          id: string
          is_active: boolean
          is_stackable: boolean
          minimum_order_cents: number
          minimum_quantity: number | null
          name: string
          per_customer_limit: number | null
          priority: number
          promotion_type: string
          starts_at: string
          store_id: string
          updated_at: string
          usage_limit: number | null
          value: number
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          is_active?: boolean
          is_stackable?: boolean
          minimum_order_cents?: number
          minimum_quantity?: number | null
          name: string
          per_customer_limit?: number | null
          priority?: number
          promotion_type: string
          starts_at: string
          store_id: string
          updated_at?: string
          usage_limit?: number | null
          value?: number
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          is_active?: boolean
          is_stackable?: boolean
          minimum_order_cents?: number
          minimum_quantity?: number | null
          name?: string
          per_customer_limit?: number | null
          priority?: number
          promotion_type?: string
          starts_at?: string
          store_id?: string
          updated_at?: string
          usage_limit?: number | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_access_audit: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          id: string
          new_active: boolean | null
          new_role: string | null
          previous_active: boolean | null
          previous_role: string | null
          store_id: string
          target_user_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          id?: string
          new_active?: boolean | null
          new_role?: string | null
          previous_active?: boolean | null
          previous_role?: string | null
          store_id: string
          target_user_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          id?: string
          new_active?: boolean | null
          new_role?: string | null
          previous_active?: boolean | null
          previous_role?: string | null
          store_id?: string
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_access_audit_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_business_hours: {
        Row: {
          closes_at: string | null
          created_at: string
          id: string
          is_closed: boolean
          opens_at: string | null
          store_id: string
          updated_at: string
          weekday: number
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          id?: string
          is_closed?: boolean
          opens_at?: string | null
          store_id: string
          updated_at?: string
          weekday: number
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          id?: string
          is_closed?: boolean
          opens_at?: string | null
          store_id?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_business_hours_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_fulfillment_rules: {
        Row: {
          capacity_basis: string
          delivery_staff_count: number | null
          fulfillment_type: string
          max_orders_per_slot: number
          minimum_notice_minutes: number
          slot_minutes: number
          store_id: string
          updated_at: string
        }
        Insert: {
          capacity_basis: string
          delivery_staff_count?: number | null
          fulfillment_type: string
          max_orders_per_slot: number
          minimum_notice_minutes: number
          slot_minutes: number
          store_id: string
          updated_at?: string
        }
        Update: {
          capacity_basis?: string
          delivery_staff_count?: number | null
          fulfillment_type?: string
          max_orders_per_slot?: number
          minimum_notice_minutes?: number
          slot_minutes?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_fulfillment_rules_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_memberships: {
        Row: {
          created_at: string
          is_active: boolean
          role: string
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean
          role: string
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          is_active?: boolean
          role?: string
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_memberships_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_operational_state: {
        Row: {
          changed_by: string | null
          estimated_resume_at: string | null
          preparation_started_at: string | null
          public_message: string | null
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          changed_by?: string | null
          estimated_resume_at?: string | null
          preparation_started_at?: string | null
          public_message?: string | null
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          changed_by?: string | null
          estimated_resume_at?: string | null
          preparation_started_at?: string | null
          public_message?: string | null
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_operational_state_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_schedule_exceptions: {
        Row: {
          closes_at: string | null
          created_at: string
          created_by: string | null
          id: string
          is_closed: boolean
          local_date: string
          opens_at: string | null
          public_message: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_closed?: boolean
          local_date: string
          opens_at?: string | null
          public_message?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_closed?: boolean
          local_date?: string
          opens_at?: string | null
          public_message?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_schedule_exceptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          accepts_card: boolean
          accepts_cash_pickup: boolean
          accepts_delivery: boolean
          accepts_pickup: boolean
          accepts_plin: boolean
          accepts_yape: boolean
          created_at: string
          currency: string
          default_preparation_minutes: number
          display_name: string
          legal_name: string | null
          locale: string
          manual_payment_window_minutes: number | null
          phone: string | null
          plin_recipient_name: string | null
          plin_recipient_phone: string | null
          store_id: string
          tax_id: string | null
          updated_at: string
          updated_by: string | null
          whatsapp_phone: string | null
          yape_recipient_name: string | null
          yape_recipient_phone: string | null
        }
        Insert: {
          accepts_card?: boolean
          accepts_cash_pickup?: boolean
          accepts_delivery?: boolean
          accepts_pickup?: boolean
          accepts_plin?: boolean
          accepts_yape?: boolean
          created_at?: string
          currency?: string
          default_preparation_minutes?: number
          display_name: string
          legal_name?: string | null
          locale?: string
          manual_payment_window_minutes?: number | null
          phone?: string | null
          plin_recipient_name?: string | null
          plin_recipient_phone?: string | null
          store_id: string
          tax_id?: string | null
          updated_at?: string
          updated_by?: string | null
          whatsapp_phone?: string | null
          yape_recipient_name?: string | null
          yape_recipient_phone?: string | null
        }
        Update: {
          accepts_card?: boolean
          accepts_cash_pickup?: boolean
          accepts_delivery?: boolean
          accepts_pickup?: boolean
          accepts_plin?: boolean
          accepts_yape?: boolean
          created_at?: string
          currency?: string
          default_preparation_minutes?: number
          display_name?: string
          legal_name?: string | null
          locale?: string
          manual_payment_window_minutes?: number | null
          phone?: string | null
          plin_recipient_name?: string | null
          plin_recipient_phone?: string | null
          store_id?: string
          tax_id?: string | null
          updated_at?: string
          updated_by?: string | null
          whatsapp_phone?: string | null
          yape_recipient_name?: string | null
          yape_recipient_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          code: string
          created_at: string
          district: string | null
          id: string
          name: string
          organization_id: string
          slug: string
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          district?: string | null
          id?: string
          name: string
          organization_id: string
          slug: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          district?: string | null
          id?: string
          name?: string
          organization_id?: string
          slug?: string
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          store_id: string
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          store_id: string
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          store_id?: string
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_inventory_lot: {
        Args: {
          p_counted_quantity: number
          p_lot_id: string
          p_operation_id: string
          p_reason: string
          p_store_id: string
        }
        Returns: Json
      }
      assign_delivery: {
        Args: {
          p_driver_user_id: string
          p_operation_id: string
          p_order_id: string
          p_store_id: string
        }
        Returns: Json
      }
      cancel_customer_order: {
        Args: { p_operation_id: string; p_order_id: string }
        Returns: Json
      }
      complete_delivery: {
        Args: {
          p_assignment_id: string
          p_confirmation_code: string
          p_evidence_storage_path: string
          p_operation_id: string
          p_recipient_name: string
          p_store_id: string
        }
        Returns: Json
      }
      complete_pickup: {
        Args: {
          p_confirmation_code: string
          p_operation_id: string
          p_order_id: string
          p_store_id: string
        }
        Returns: Json
      }
      confirm_manual_payment: {
        Args: {
          p_operation_id: string
          p_order_id: string
          p_proof_storage_path?: string
          p_provider_reference: string
          p_store_id: string
          p_transaction_id: string
        }
        Returns: Json
      }
      create_checkout_order: {
        Args: {
          p_operation_id: string
          p_payload: Json
          p_reservation_expires_at: string
        }
        Returns: Json
      }
      decide_substitution: {
        Args: {
          p_decision: string
          p_operation_id: string
          p_store_id: string
          p_substitution_id: string
        }
        Returns: Json
      }
      delete_customer_address: {
        Args: { p_address_id: string }
        Returns: undefined
      }
      finalize_weighted_order: {
        Args: {
          p_items: Json
          p_operation_id: string
          p_order_id: string
          p_store_id: string
        }
        Returns: Json
      }
      get_admin_report: {
        Args: { p_end_date: string; p_start_date: string; p_store_id: string }
        Returns: Json
      }
      get_checkout_slots: {
        Args: { p_days?: number; p_mode: string; p_store_slug: string }
        Returns: {
          available: boolean
          ends_at: string
          starts_at: string
        }[]
      }
      get_customer_account: { Args: { p_store_slug: string }; Returns: Json }
      get_customer_catalog: { Args: { p_store_slug: string }; Returns: Json }
      get_customer_delivery_zones: {
        Args: { p_store_slug: string }
        Returns: Json
      }
      get_customer_notifications: {
        Args: { p_store_slug: string }
        Returns: Json
      }
      get_customer_order_details: {
        Args: { p_order_id: string }
        Returns: Json
      }
      get_customer_payment_settings: {
        Args: { p_store_slug: string }
        Returns: Json
      }
      open_inventory_package: {
        Args: {
          p_lot_id: string
          p_operation_id: string
          p_presentation_id: string
          p_reason?: string
          p_store_id: string
          p_units: number
        }
        Returns: Json
      }
      propose_substitution: {
        Args: {
          p_expires_at: string
          p_operation_id: string
          p_order_id: string
          p_order_item_id: string
          p_proposed_quantity: number
          p_replacement_presentation_id: string
          p_store_id: string
        }
        Returns: Json
      }
      receive_inventory_lot: {
        Args: {
          p_expires_on?: string
          p_loose_quantity?: number
          p_lot_code: string
          p_notes?: string
          p_operation_id?: string
          p_product_id: string
          p_sealed?: Json
          p_store_id: string
          p_supplier_id?: string
        }
        Returns: Json
      }
      register_inventory_lot: {
        Args: {
          p_expires_on: string
          p_lot_code: string
          p_notes?: string
          p_operation_id: string
          p_product_id: string
          p_quantity: number
          p_store_id: string
          p_supplier_id: string
        }
        Returns: Json
      }
      reject_manual_payment: {
        Args: {
          p_operation_id: string
          p_reason: string
          p_store_id: string
          p_transaction_id: string
        }
        Returns: Json
      }
      report_customer_adjustment: {
        Args: { p_reference: string; p_transaction_id: string }
        Returns: Json
      }
      report_customer_payment: {
        Args: { p_order_id: string; p_reference: string }
        Returns: undefined
      }
      request_customer_account_deletion: { Args: never; Returns: Json }
      save_customer_account: {
        Args: { p_operation_id: string; p_payload: Json; p_store_id: string }
        Returns: Json
      }
      save_promotion_admin: {
        Args: {
          p_coupon_code: string
          p_description: string
          p_ends_at: string
          p_is_stackable: boolean
          p_minimum_order_cents: number
          p_minimum_quantity: number
          p_name: string
          p_operation_id: string
          p_per_customer_limit: number
          p_priority: number
          p_product_ids: string[]
          p_promotion_id: string
          p_promotion_type: string
          p_starts_at: string
          p_store_id: string
          p_usage_limit: number
          p_value: number
        }
        Returns: Json
      }
      save_store_configuration: {
        Args: {
          p_accepts_card: boolean
          p_accepts_cash_pickup: boolean
          p_accepts_delivery: boolean
          p_accepts_pickup: boolean
          p_accepts_plin: boolean
          p_accepts_yape: boolean
          p_address: string
          p_business_hours: Json
          p_default_preparation_minutes: number
          p_display_name: string
          p_district: string
          p_legal_name: string
          p_operation_id: string
          p_phone: string
          p_schedule_exceptions: Json
          p_store_id: string
          p_store_name: string
          p_tax_id: string
          p_whatsapp_phone: string
        }
        Returns: Json
      }
      set_fulfillment_rules: {
        Args: {
          p_delivery_staff_count?: number
          p_max_orders: number
          p_mode: string
          p_notice_minutes: number
          p_slot_minutes: number
          p_store_id: string
        }
        Returns: undefined
      }
      set_store_business_hours: {
        Args: {
          p_closes_at: string | null
          p_is_closed: boolean
          p_opens_at: string | null
          p_store_id: string
          p_weekday: number
        }
        Returns: Json
      }
      settle_manual_difference: {
        Args: {
          p_operation_id: string
          p_reference: string
          p_store_id: string
          p_transaction_id: string
        }
        Returns: Json
      }
      submit_customer_order: {
        Args: { p_operation_id: string; p_payload: Json }
        Returns: Json
      }
      transition_order: {
        Args: {
          p_note?: string
          p_operation_id: string
          p_order_id: string
          p_reason_code?: string
          p_store_id: string
          p_to_status: string
        }
        Returns: Json
      }
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
