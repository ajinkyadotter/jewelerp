import { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getAuthFromRequest } from "@/lib/auth"
import { ok, unauthorized, serverError } from "@/lib/api"

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthFromRequest(req)
    if (!user) return unauthorized()

    const orgId = user.org_id

    // Run queries in parallel
    const [inventory, invoicesToday, customers, rfid, recentInvoices, monthlySales] = await Promise.all([
      // Inventory stats
      supabaseAdmin
        .from("inventory_items")
        .select("status, final_price", { count: "exact" })
        .eq("org_id", orgId)
        .is("deleted_at", null),

      // Today's sales
      supabaseAdmin
        .from("invoices")
        .select("total_amount, paid_amount")
        .eq("org_id", orgId)
        .gte("created_at", new Date().toISOString().split("T")[0])
        .eq("status", "CONFIRMED"),

      // Customers count
      supabaseAdmin
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId),

      // RFID stats
      supabaseAdmin
        .from("rfid_tags")
        .select("status", { count: "exact" })
        .eq("org_id", orgId),

      // Recent invoices
      supabaseAdmin
        .from("invoices")
        .select("*, customers(name)")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(5),

      // Monthly sales for chart (last 6 months)
      supabaseAdmin
        .from("invoices")
        .select("total_amount, created_at")
        .eq("org_id", orgId)
        .eq("status", "CONFIRMED")
        .gte("created_at", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    const invData = inventory.data ?? []
    const totalInventory = inventory.count ?? 0
    const availableItems = invData.filter((i) => i.status === "AVAILABLE").length
    const lowStock = invData.filter((i) => i.status === "AVAILABLE").length < 10 ? totalInventory : 0

    const todaySales = (invoicesToday.data ?? []).reduce((s, i) => s + (i.total_amount ?? 0), 0)
    const todayPaid = (invoicesToday.data ?? []).reduce((s, i) => s + (i.paid_amount ?? 0), 0)

    const inventoryValue = invData
      .filter((i) => i.status === "AVAILABLE")
      .reduce((s, i) => s + (i.final_price ?? 0), 0)

    // Group monthly sales
    const months: Record<string, number> = {}
    ;(monthlySales.data ?? []).forEach((inv) => {
      const month = inv.created_at.slice(0, 7)
      months[month] = (months[month] ?? 0) + inv.total_amount
    })

    const rfidData = rfid.data ?? []
    const taggedItems = rfidData.filter((r) => r.status === "ACTIVE").length

    return ok({
      totalInventory,
      availableItems,
      inventoryValue,
      todaySales,
      todayPaid,
      totalCustomers: customers.count ?? 0,
      totalOrders: invoicesToday.count ?? 0,
      taggedItems,
      untaggedItems: availableItems - taggedItems,
      rfidCoverage: availableItems > 0 ? Math.round((taggedItems / availableItems) * 100) : 0,
      recentInvoices: recentInvoices.data ?? [],
      monthlySales: Object.entries(months)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, amount]) => ({ month, amount })),
    })
  } catch (e) {
    return serverError(e)
  }
}
