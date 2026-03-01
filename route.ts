import { NextRequest } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase"
import { getAuthFromRequest } from "@/lib/auth"
import { ok, err, unauthorized, serverError } from "@/lib/api"
import { calculatePrice, generateSKU, generateBarcode } from "@/lib/pricing"

const itemSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  metal_type: z.string().optional(),
  purity: z.string().optional(),
  gross_weight: z.number().optional(),
  net_weight: z.number().optional(),
  wastage_percent: z.number().optional(),
  making_charge_type: z.enum(["PER_GRAM", "FIXED", "PERCENTAGE"]).optional(),
  making_charge_value: z.number().optional(),
  stone_type: z.string().optional(),
  stone_carat: z.number().optional(),
  stone_value: z.number().optional(),
  gst_percent: z.number().default(3),
  location: z.string().optional(),
  vendor: z.string().optional(),
  hsn_code: z.string().default("7113"),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

// GET /api/inventory
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req)
    if (!user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const category = searchParams.get("category") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from("inventory_items")
      .select("*", { count: "exact" })
      .eq("org_id", user.org_id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`)
    }
    if (status) query = query.eq("status", status)
    if (category) query = query.eq("category", category)

    const { data, error, count } = await query
    if (error) return serverError(error)

    return ok({ items: data, total: count, page, limit })
  } catch (e) {
    return serverError(e)
  }
}

// POST /api/inventory
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req)
    if (!user) return unauthorized()

    const body = await req.json()
    const parsed = itemSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const data = parsed.data

    // Get metal rate for pricing
    let metalRatePerGram = 0
    if (data.metal_type && data.purity) {
      const { data: rateRow } = await supabaseAdmin
        .from("metal_rates")
        .select("rate_per_gram, custom_rate")
        .eq("org_id", user.org_id)
        .eq("metal_type", data.metal_type)
        .eq("purity", data.purity)
        .single()
      if (rateRow) metalRatePerGram = rateRow.custom_rate ?? rateRow.rate_per_gram
    }

    // Calculate pricing
    const pricing = calculatePrice({
      metalType: data.metal_type,
      purity: data.purity,
      grossWeight: data.gross_weight,
      netWeight: data.net_weight,
      wastagePercent: data.wastage_percent,
      makingChargeType: data.making_charge_type as any,
      makingChargeValue: data.making_charge_value,
      stoneValue: data.stone_value,
      gstPercent: data.gst_percent,
      metalRatePerGram,
    })

    // Generate SKU and barcode
    const { count } = await supabaseAdmin
      .from("inventory_items")
      .select("*", { count: "exact", head: true })
      .eq("org_id", user.org_id)

    const seq = (count ?? 0) + 1
    const sku = generateSKU(data.category, data.metal_type || "XX", seq)
    const barcode = generateBarcode("ORG", seq)

    const { data: item, error } = await supabaseAdmin
      .from("inventory_items")
      .insert({
        org_id: user.org_id,
        sku,
        barcode,
        name: data.name,
        description: data.description,
        category: data.category,
        metal_type: data.metal_type,
        purity: data.purity,
        gross_weight: data.gross_weight,
        net_weight: pricing.netWeight,
        wastage_percent: data.wastage_percent,
        making_charge_type: data.making_charge_type,
        making_charge_value: data.making_charge_value,
        stone_type: data.stone_type,
        stone_carat: data.stone_carat,
        stone_value: data.stone_value,
        metal_value: pricing.metalValue,
        making_charge: pricing.makingCharge,
        subtotal: pricing.subtotal,
        gst_percent: data.gst_percent,
        gst_amount: pricing.gstAmount,
        final_price: pricing.totalPrice,
        location: data.location,
        vendor: data.vendor,
        hsn_code: data.hsn_code,
        tags: data.tags,
        status: "AVAILABLE",
      })
      .select()
      .single()

    if (error) return serverError(error)
    return ok(item, 201)
  } catch (e) {
    return serverError(e)
  }
}
