import { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getAuthFromRequest } from "@/lib/auth"
import { ok, err, unauthorized, notFound, serverError } from "@/lib/api"
import { calculatePrice } from "@/lib/pricing"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthFromRequest(req)
    if (!user) return unauthorized()

    const { data, error } = await supabaseAdmin
      .from("inventory_items")
      .select("*")
      .eq("id", params.id)
      .eq("org_id", user.org_id)
      .is("deleted_at", null)
      .single()

    if (error || !data) return notFound("Item")
    return ok(data)
  } catch (e) {
    return serverError(e)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthFromRequest(req)
    if (!user) return unauthorized()

    const body = await req.json()

    // Recalculate price if metal/weight changed
    let priceFields = {}
    if (body.metal_type || body.net_weight || body.making_charge_value) {
      let metalRatePerGram = 0
      if (body.metal_type && body.purity) {
        const { data: rate } = await supabaseAdmin
          .from("metal_rates")
          .select("rate_per_gram, custom_rate")
          .eq("org_id", user.org_id)
          .eq("metal_type", body.metal_type)
          .eq("purity", body.purity)
          .single()
        if (rate) metalRatePerGram = rate.custom_rate ?? rate.rate_per_gram
      }

      const pricing = calculatePrice({
        netWeight: body.net_weight,
        grossWeight: body.gross_weight,
        wastagePercent: body.wastage_percent,
        makingChargeType: body.making_charge_type,
        makingChargeValue: body.making_charge_value,
        stoneValue: body.stone_value,
        gstPercent: body.gst_percent ?? 3,
        metalRatePerGram,
      })

      priceFields = {
        metal_value: pricing.metalValue,
        making_charge: pricing.makingCharge,
        subtotal: pricing.subtotal,
        gst_amount: pricing.gstAmount,
        final_price: pricing.totalPrice,
      }
    }

    const { data, error } = await supabaseAdmin
      .from("inventory_items")
      .update({ ...body, ...priceFields })
      .eq("id", params.id)
      .eq("org_id", user.org_id)
      .select()
      .single()

    if (error) return serverError(error)
    return ok(data)
  } catch (e) {
    return serverError(e)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthFromRequest(req)
    if (!user) return unauthorized()

    // Soft delete
    const { error } = await supabaseAdmin
      .from("inventory_items")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", params.id)
      .eq("org_id", user.org_id)

    if (error) return serverError(error)
    return ok({ deleted: true })
  } catch (e) {
    return serverError(e)
  }
}
