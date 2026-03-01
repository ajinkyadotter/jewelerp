import { NextRequest } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase"
import { getAuthFromRequest, can } from "@/lib/auth"
import { ok, err, unauthorized, forbidden, serverError } from "@/lib/api"

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req)
    if (!user) return unauthorized()

    const { data, error } = await supabaseAdmin
      .from("rfid_tags")
      .select("*, inventory_items(sku, name, status)")
      .eq("org_id", user.org_id)
      .order("created_at", { ascending: false })

    if (error) return serverError(error)
    return ok(data)
  } catch (e) {
    return serverError(e)
  }
}

const assignSchema = z.object({
  tag_uid: z.string().min(1),
  item_id: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req)
    if (!user) return unauthorized()
    if (!can(user.role, "rfid:write")) return forbidden()

    const body = await req.json()
    const action = body.action // "assign" | "remove" | "report_lost"

    if (action === "assign") {
      const parsed = assignSchema.safeParse(body)
      if (!parsed.success) return err(parsed.error.message)
      const { tag_uid, item_id } = parsed.data

      // Check tag doesn't already exist as active
      const { data: existing } = await supabaseAdmin
        .from("rfid_tags")
        .select("*")
        .eq("tag_uid", tag_uid)
        .eq("org_id", user.org_id)
        .single()

      if (existing) {
        if (existing.status === "ACTIVE") return err("Tag already assigned to another item")
        if (existing.status === "LOST") return err("Cannot assign a reported lost tag")
        // Reactivate removed tag
        const { data, error } = await supabaseAdmin
          .from("rfid_tags")
          .update({ item_id, status: "ACTIVE", assigned_by: user.id, assigned_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select().single()
        if (error) return serverError(error)
        return ok(data)
      }

      // Create new tag assignment
      const { data, error } = await supabaseAdmin
        .from("rfid_tags")
        .insert({
          org_id: user.org_id,
          tag_uid,
          item_id,
          status: "ACTIVE",
          assigned_by: user.id,
          assigned_at: new Date().toISOString(),
        })
        .select().single()

      if (error) return serverError(error)

      // Log
      await supabaseAdmin.from("rfid_logs").insert({
        org_id: user.org_id, tag_id: data.id,
        item_id, user_id: user.id, action: "ASSIGNED",
      })

      return ok(data, 201)
    }

    if (action === "remove") {
      const { tag_id } = body
      if (!tag_id) return err("tag_id required")

      const { data, error } = await supabaseAdmin
        .from("rfid_tags")
        .update({ status: "REMOVED", item_id: null })
        .eq("id", tag_id)
        .eq("org_id", user.org_id)
        .select().single()

      if (error) return serverError(error)
      await supabaseAdmin.from("rfid_logs").insert({
        org_id: user.org_id, tag_id, user_id: user.id, action: "REMOVED",
      })
      return ok(data)
    }

    return err("Unknown action")
  } catch (e) {
    return serverError(e)
  }
}
