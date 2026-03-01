import { getAuthFromCookie } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { formatINR } from "@/lib/utils"
import DashboardClient from "./DashboardClient"

async function getDashboardData(orgId: string) {
  const [inventory, invoices, customers, recentInvoices] = await Promise.all([
    supabaseAdmin.from("inventory_items").select("status, final_price").eq("org_id", orgId).is("deleted_at", null),
    supabaseAdmin.from("invoices").select("total_amount, paid_amount, created_at").eq("org_id", orgId).eq("status", "CONFIRMED"),
    supabaseAdmin.from("customers").select("*", { count: "exact", head: true }).eq("org_id", orgId),
    supabaseAdmin.from("invoices").select("*, customers(name)").eq("org_id", orgId).order("created_at", { ascending: false }).limit(5),
  ])

  const invData: any[] = inventory.data ?? []
  const invTotal = invData.length
  const available = invData.filter((i: any) => i.status === "AVAILABLE").length
  const inventoryValue = invData.filter((i: any) => i.status === "AVAILABLE").reduce((s: number, i: any) => s + (i.final_price ?? 0), 0)

  const allInvoices: any[] = invoices.data ?? []
  const today = new Date().toISOString().split("T")[0]
  const todaySales = allInvoices.filter((i: any) => i.created_at.startsWith(today)).reduce((s: number, i: any) => s + i.total_amount, 0)
  const totalRevenue = allInvoices.reduce((s: number, i: any) => s + i.total_amount, 0)

  const monthly: Record<string, number> = {}
  allInvoices.forEach((inv: any) => {
    const m = inv.created_at.slice(0, 7)
    monthly[m] = (monthly[m] ?? 0) + inv.total_amount
  })
  const chartData = Object.entries(monthly)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, amount]) => ({
      month: new Date(month + "-01").toLocaleString("default", { month: "short" }),
      amount: Math.round(amount),
    }))

  return {
    totalInventory: invTotal,
    availableItems: available,
    inventoryValue,
    todaySales,
    totalRevenue,
    totalCustomers: customers.count ?? 0,
    totalOrders: allInvoices.length,
    recentInvoices: recentInvoices.data ?? [],
    chartData,
  }
}

export default async function DashboardPage() {
  const user = await getAuthFromCookie()
  if (!user) return null
  const data = await getDashboardData(user.org_id)
  return <DashboardClient data={data} />
}
