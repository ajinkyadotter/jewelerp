import { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getAuthFromRequest, can } from "@/lib/auth"
import { ok, err, unauthorized, forbidden, serverError } from "@/lib/api"

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req)
    if (!user) return unauthorized()

    const { data, error } = await supabaseAdmin
      .from("metal_rates")
      .select("*")
      .eq("org_id", user.org_id)
      .order("metal_type")
      .order("purity")

    if (error) return serverError(error)
    return ok(data)
  } catch (e) {
    return serverError(e)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req)
    if (!user) return unauthorized()
    if (!can(user.role, "rates:write")) return forbidden()

    const body = await req.json()
    const { id, custom_rate } = body

    if (!id) return err("Rate ID required")

    const { data, error } = await supabaseAdmin
      .from("metal_rates")
      .update({ custom_rate, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("org_id", user.org_id)
      .select()
      .single()

    if (error) return serverError(error)
    return ok(data)
  } catch (e) {
    return serverError(e)
  }
}
