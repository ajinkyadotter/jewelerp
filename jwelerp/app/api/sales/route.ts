import { NextRequest } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase"
import { getAuthFromRequest } from "@/lib/auth"
import { ok, err, unauthorized, serverError } from "@/lib/api"

const invoiceSchema = z.object({
  customer_id: z.string().uuid().optional(),
  items: z.array(z.object({
    item_id: z.string().uuid().optional(),
    name: z.string(),
    quantity: z.number().default(1),
    unit_price: z.number(),
    gst_percent: z.number().default(3),
  })),
  payment_method: z.string().optional(),
  paid_amount: z.number().default(0),
  notes: z.string().optional(),
  is_inter_state: z.boolean().default(false),
})

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req)
    if (!user) return unauthorized()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = (page - 1) * limit
    const status = searchParams.get("status") || ""

    let query = supabaseAdmin
      .from("invoices")
      .select(`*, customers(name, phone), users!invoices_created_by_fkey(first_name, last_name)`, { count: "exact" })
      .eq("org_id", user.org_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq("payment_status", status)

    const { data, error, count } = await query
    if (error) return serverError(error)

    return ok({ invoices: data, total: count, page, limit })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req)
    if (!user) return unauthorized()

    const body = await req.json()
    const parsed = invoiceSchema.safeParse(body)
    if (!parsed.success) return err(parsed.error.message)

    const { customer_id, items, payment_method, paid_amount, notes, is_inter_state } = parsed.data

    // Calculate totals
    let subtotal = 0
    let totalGst = 0
    const invoiceItems = items.map((item) => {
      const gstAmt = Math.round(item.unit_price * item.quantity * (item.gst_percent / 100) * 100) / 100
      const total = item.unit_price * item.quantity + gstAmt
      subtotal += item.unit_price * item.quantity
      totalGst += gstAmt
      return { ...item, gst_amount: gstAmt, total }
    })

    const totalAmount = subtotal + totalGst
    const balance = totalAmount - paid_amount

    // GST split
    const cgst = is_inter_state ? 0 : Math.round(totalGst / 2 * 100) / 100
    const sgst = is_inter_state ? 0 : Math.round(totalGst / 2 * 100) / 100
    const igst = is_inter_state ? totalGst : 0

    // Generate invoice number
    const { count } = await supabaseAdmin
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("org_id", user.org_id)

    const invoiceNo = `INV-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(4, "0")}`

    const paymentStatus = paid_amount >= totalAmount ? "PAID" : paid_amount > 0 ? "PARTIAL" : "UNPAID"

    // Create invoice
    const { data: invoice, error: invErr } = await supabaseAdmin
      .from("invoices")
      .insert({
        org_id: user.org_id,
        invoice_no: invoiceNo,
        customer_id,
        created_by: user.id,
        subtotal,
        cgst,
        sgst,
        igst,
        total_amount: totalAmount,
        paid_amount,
        balance,
        status: "CONFIRMED",
        payment_status: paymentStatus,
        payment_method,
        notes,
      })
      .select()
      .single()

    if (invErr) return serverError(invErr)

    // Create invoice items
    await supabaseAdmin.from("invoice_items").insert(
      invoiceItems.map((i) => ({ invoice_id: invoice.id, ...i }))
    )

    // Mark items as SOLD and update customer total
    for (const item of items) {
      if (item.item_id) {
        await supabaseAdmin
          .from("inventory_items")
          .update({ status: "SOLD" })
          .eq("id", item.item_id)
      }
    }

    // Record payment if any
    if (paid_amount > 0 && payment_method) {
      await supabaseAdmin.from("payments").insert({
        org_id: user.org_id,
        invoice_id: invoice.id,
        amount: paid_amount,
        method: payment_method,
      })
    }

    // Update customer loyalty
    if (customer_id) {
      const loyaltyPoints = Math.floor(totalAmount / 1000)
      await supabaseAdmin.rpc("increment_customer_loyalty", {
        p_customer_id: customer_id,
        p_points: loyaltyPoints,
        p_amount: totalAmount,
      }).catch(() => {})
    }

    return ok(invoice, 201)
  } catch (e) {
    return serverError(e)
  }
}
