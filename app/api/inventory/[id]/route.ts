import { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getAuthFromRequest } from "@/lib/auth"
import { ok, notFound, serverError, unauthorized } from "@/lib/api"

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req)
    if (!user) return unauthorized()
    const id = req.nextUrl.pathname.split("/").pop()!
    const { data, error } = await supabaseAdmin
      .from("inventory_items").select("*")
      .eq("id", id).eq("org_id", user.org_id).is("deleted_at", null).single()
    if (error || !data) return notFound("Item")
    return ok(data)
  } catch (e) { return serverError(e) }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req)
    if (!user) return unauthorized()
    const id = req.nextUrl.pathname.split("/").pop()!
    const body = await req.json()
    const { data, error } = await supabaseAdmin
      .from("inventory_items")
      .update(body).eq("id", id).eq("org_id", user.org_id).select().single()
    if (error) return serverError(error)
    return ok(data)
  } catch (e) { return serverError(e) }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req)
    if (!user) return unauthorized()
    const id = req.nextUrl.pathname.split("/").pop()!
    const { error } = await supabaseAdmin
      .from("inventory_items")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id).eq("org_id", user.org_id)
    if (error) return serverError(error)
    return ok({ deleted: true })
  } catch (e) { return serverError(e) }
}
