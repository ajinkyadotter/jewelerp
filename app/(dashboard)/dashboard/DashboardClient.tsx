"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { formatINR } from "@/lib/utils"
import AddItemModal from "@/components/modules/AddItemModal"

interface DashboardData {
  totalInventory: number
  availableItems: number
  inventoryValue: number
  todaySales: number
  totalRevenue: number
  totalCustomers: number
  totalOrders: number
  recentInvoices: any[]
  chartData: { month: string; amount: number }[]
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "bg-green-100 text-green-700 border-green-200",
    PARTIAL: "bg-yellow-100 text-yellow-700 border-yellow-200",
    UNPAID: "bg-red-100 text-red-700 border-red-200",
    CONFIRMED: "bg-blue-100 text-blue-700 border-blue-200",
    DRAFT: "bg-gray-100 text-gray-600 border-gray-200",
    CANCELLED: "bg-red-100 text-red-600 border-red-200",
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {status}
    </span>
  )
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const router = useRouter()
  const [showAddItem, setShowAddItem] = useState(false)

  const maxChart = Math.max(...data.chartData.map((d) => d.amount), 1)

  const stats = [
    { label: "Today's Sales", value: formatINR(data.todaySales), sub: "Revenue today", icon: "🛒", iconBg: "bg-blue-50", subColor: "text-green-600" },
    { label: "Total Orders", value: data.totalOrders.toLocaleString(), sub: "All time", icon: "📦", iconBg: "bg-orange-50", subColor: "text-green-600" },
    { label: "Active Customers", value: data.totalCustomers.toLocaleString(), sub: "Registered", icon: "👥", iconBg: "bg-green-50", subColor: "text-green-600" },
    { label: "Inventory Items", value: data.totalInventory.toLocaleString(), sub: `${data.availableItems} available`, icon: "⚡", iconBg: "bg-red-50", subColor: "text-red-500" },
  ]

  return (
    <div className="p-7 max-w-[1400px]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening in your business today.</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-7 flex-wrap">
        <button onClick={() => setShowAddItem(true)}
          className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#2a4f80] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">
          + Add Item
        </button>
        <button onClick={() => router.push("/sales")}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          🛒 New Order
        </button>
        <button onClick={() => router.push("/inventory")}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          ◈ View Inventory
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-5 flex justify-between items-start shadow-sm">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1.5">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className={`text-xs mt-1.5 ${s.subColor}`}>↗ {s.sub}</p>
            </div>
            <div className={`w-11 h-11 ${s.iconBg} rounded-xl flex items-center justify-center text-xl`}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-4 mb-4">
        {/* Bar chart */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-1">Sales Overview</h3>
          <p className="text-gray-400 text-xs mb-5">Monthly sales trends</p>

          {data.chartData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-300 text-sm">No sales data yet</div>
          ) : (
            <>
              <div className="flex items-end gap-3 h-36">
                {data.chartData.map((d, i) => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1.5">
                    <p className="text-xs font-mono text-gray-500">{formatINR(d.amount).replace("₹", "")}</p>
                    <div
                      className="w-full rounded-t-md bg-[#3730a3] transition-all"
                      style={{ height: `${Math.max(8, (d.amount / maxChart) * 120)}px` }}
                    />
                    <span className="text-xs text-gray-400">{d.month}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#3730a3]" />Sales
                </span>
              </div>
            </>
          )}
        </div>

        {/* Inventory mix donut */}
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 text-sm mb-1">Inventory Mix</h3>
          <p className="text-gray-400 text-xs mb-4">By material type</p>
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 140 140" width={130} height={130}>
              {[
                { pct: 35, color: "#f59e0b", off: 0 },
                { pct: 25, color: "#d1d5db", off: 35 },
                { pct: 20, color: "#3b82f6", off: 60 },
                { pct: 20, color: "#ec4899", off: 80 },
              ].map(({ pct, color, off }) => {
                const r = 50, circ = 2 * Math.PI * r
                const dash = (pct / 100) * circ
                const rot = -90 + (off / 100) * 360
                return (
                  <circle key={color} cx={70} cy={70} r={r} fill="none"
                    stroke={color} strokeWidth={22}
                    strokeDasharray={`${dash} ${circ - dash}`}
                    transform={`rotate(${rot} 70 70)`}
                  />
                )
              })}
            </svg>
            <div className="w-full mt-3 space-y-2">
              {[["Gold", "#f59e0b", "35%"], ["Silver", "#d1d5db", "25%"], ["Platinum", "#3b82f6", "20%"], ["Diamond", "#ec4899", "20%"]].map(([l, c, p]) => (
                <div key={l} className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />{l}
                  </span>
                  <span className="text-xs font-semibold text-gray-800">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <h3 className="font-bold text-gray-900 text-sm">Recent Orders</h3>
          <button onClick={() => router.push("/sales")} className="text-[#1e3a5f] text-xs font-semibold hover:underline">View all →</button>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {["Invoice No", "Customer", "Date", "Amount", "Status"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.recentInvoices.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">No orders yet</td></tr>
            ) : data.recentInvoices.map((inv: any) => (
              <tr key={inv.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 text-sm font-bold text-[#1e3a5f]">{inv.invoice_no}</td>
                <td className="px-5 py-3.5 text-sm text-gray-700">{inv.customers?.name || "Walk-in"}</td>
                <td className="px-5 py-3.5 text-xs text-gray-500">{new Date(inv.created_at).toLocaleDateString("en-IN")}</td>
                <td className="px-5 py-3.5 text-sm font-bold text-gray-900">{formatINR(inv.total_amount)}</td>
                <td className="px-5 py-3.5"><StatusBadge status={inv.payment_status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddItem && <AddItemModal onClose={() => { setShowAddItem(false); router.refresh() }} />}
    </div>
  )
}
