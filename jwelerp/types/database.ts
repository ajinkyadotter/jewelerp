export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string; name: string; slug: string; gstin: string | null
          address: string | null; city: string | null; state: string | null
          phone: string | null; email: string | null; plan: string
          created_at: string; updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["organizations"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>
      }
      users: {
        Row: {
          id: string; org_id: string; email: string; password_hash: string
          first_name: string; last_name: string; phone: string | null
          role: "ADMIN" | "MANAGER" | "STAFF" | "ACCOUNTANT"
          is_active: boolean; created_at: string; updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>
      }
      metal_rates: {
        Row: {
          id: string; org_id: string; metal_type: string; purity: string
          rate_per_gram: number; custom_rate: number | null
          source: string; updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["metal_rates"]["Row"], "id" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["metal_rates"]["Insert"]>
      }
      inventory_items: {
        Row: {
          id: string; org_id: string; sku: string; barcode: string
          name: string; description: string | null; category: string
          metal_type: string | null; purity: string | null
          gross_weight: number | null; net_weight: number | null
          wastage_percent: number | null
          making_charge_type: string | null; making_charge_value: number | null
          stone_type: string | null; stone_carat: number | null; stone_value: number | null
          metal_value: number | null; making_charge: number | null
          subtotal: number | null; gst_percent: number; gst_amount: number | null
          final_price: number | null
          status: "AVAILABLE" | "SOLD" | "RESERVED" | "REPAIR"
          location: string | null; vendor: string | null; hsn_code: string | null
          images: string[]; tags: string[]
          created_at: string; updated_at: string; deleted_at: string | null
        }
        Insert: Omit<Database["public"]["Tables"]["inventory_items"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["inventory_items"]["Insert"]>
      }
      customers: {
        Row: {
          id: string; org_id: string; name: string; phone: string | null
          email: string | null; gstin: string | null; address: string | null
          city: string | null; state: string | null
          loyalty_points: number; total_purchase: number
          created_at: string; updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["customers"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>
      }
      invoices: {
        Row: {
          id: string; org_id: string; invoice_no: string
          customer_id: string | null; created_by: string
          subtotal: number; cgst: number; sgst: number; igst: number
          total_amount: number; paid_amount: number; balance: number
          status: "DRAFT" | "CONFIRMED" | "CANCELLED"
          payment_status: "UNPAID" | "PARTIAL" | "PAID"
          notes: string | null; created_at: string; updated_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["invoices"]["Row"], "id" | "created_at" | "updated_at">
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>
      }
      invoice_items: {
        Row: {
          id: string; invoice_id: string; item_id: string | null
          name: string; quantity: number; unit_price: number
          gst_percent: number; gst_amount: number; total: number
        }
        Insert: Omit<Database["public"]["Tables"]["invoice_items"]["Row"], "id">
        Update: Partial<Database["public"]["Tables"]["invoice_items"]["Insert"]>
      }
      rfid_tags: {
        Row: {
          id: string; org_id: string; tag_uid: string
          item_id: string | null; status: "UNASSIGNED" | "ACTIVE" | "REMOVED" | "LOST"
          assigned_by: string | null; assigned_at: string | null; created_at: string
        }
        Insert: Omit<Database["public"]["Tables"]["rfid_tags"]["Row"], "id" | "created_at">
        Update: Partial<Database["public"]["Tables"]["rfid_tags"]["Insert"]>
      }
    }
  }
}

// Convenience types
export type OrgRow = Database["public"]["Tables"]["organizations"]["Row"]
export type UserRow = Database["public"]["Tables"]["users"]["Row"]
export type InventoryRow = Database["public"]["Tables"]["inventory_items"]["Row"]
export type MetalRateRow = Database["public"]["Tables"]["metal_rates"]["Row"]
export type CustomerRow = Database["public"]["Tables"]["customers"]["Row"]
export type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"]
export type InvoiceItemRow = Database["public"]["Tables"]["invoice_items"]["Row"]
export type RfidTagRow = Database["public"]["Tables"]["rfid_tags"]["Row"]
