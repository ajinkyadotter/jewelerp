import { NextRequest } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase"
import { getAuthFromRequest } from "@/lib/auth"
import { ok, err, unauthorized, serverError } from "@/lib/api"

const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  gstin: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req)
    if (!user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from("customers")
      .select("*", { count: "exact" })
      .eq("org_id", user.org_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)

    const { data, error, count } = await query
    if (error) return serverError(error)

    return ok({ customers: data, total: count, page, limit })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req)
    if (!user) return unauthorized()

    const body = await req.json()
    const parsed = customerSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const { data, error } = await supabaseAdmin
      .from("customers")
      .insert({ org_id: user.org_id, ...parsed.data })
      .select()
      .single()

    if (error) return serverError(error)
    return ok(data, 201)
  } catch (e) {
    return serverError(e)
  }
}
