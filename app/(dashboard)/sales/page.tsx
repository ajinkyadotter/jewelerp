"use client"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { formatINR } from "@/lib/utils"

const PAYMENT_BADGE: Record<string, string> = {
  PAID: "bg-green-100 text-green-700 border-green-200",
  PARTIAL: "bg-yellow-100 text-yellow-700 border-yellow-200",
  UNPAID: "bg-red-100 text-red-700 border-red-200",
}
const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: "bg-blue-100 text-blue-700 border-blue-200",
  DRAFT: "bg-gray-100 text-gray-600 border-gray-200",
  CANCELLED: "bg-red-100 text-red-600 border-red-200",
}

function Badge({ label, map }: { label: string; map: Record<string, string> }) {
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[label] || "bg-gray-100 text-gray-600"}`}>{label}</span>
}

export default function SalesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page: String(page), limit: "20" })
      if (statusFilter) p.set("status", statusFilter)
      const res = await fetch(`/api/sales?${p}`)
      const data = await res.json()
      if (data.success) { setInvoices(data.data.invoices); setTotal(data.data.total) }
    } catch { toast.error("Failed to load") }
    finally { setLoading(false) }
  }, [page, statusFilter])

  useEffect(() => { fetch_() }, [fetch_])

  const totalRev = invoices.reduce((s, i) => s + i.total_amount, 0)
  const paidCount = invoices.filter((i) => i.payment_status === "PAID").length
  const pendingCount = invoices.filter((i) => i.payment_status !== "PAID").length

  const filtered = search
    ? invoices.filter((i) => i.invoice_no.includes(search) || i.customers?.name?.toLowerCase().includes(search.toLowerCase()))
    : invoices

  return (
    <div className="p-7">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales & Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Manage customer orders and sales transactions</p>
        </div>
        <button className="bg-[#1e3a5f] hover:bg-[#2a4f80] text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors">
          + New Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Revenue", value: formatINR(totalRev), color: "text-gray-900" },
          { label: "Completed Orders", value: paidCount, color: "text-green-600" },
          { label: "Pending Orders", value: pendingCount, color: "text-amber-600" },
          { label: "Total Orders", value: total, color: "text-gray-900" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-2">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="bg-white border border-gray-100 rounded-xl p-3.5 mb-3 flex gap-3 items-center shadow-sm">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order number or customer..."
          className="flex-1 text-sm text-gray-700 outline-none bg-transparent placeholder-gray-400 px-2" />
        <div className="flex gap-2">
          {[["", "All"], ["PAID", "Paid"], ["PARTIAL", "Partial"], ["UNPAID", "Unpaid"]].map(([v, l]) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                statusFilter === v ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "bg-white text-gray-600 border-gray-200"
              }`}>{l}</button>
          ))}
        </div>
        <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">↓ Export</button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Order #", "Customer", "Date", "Items", "Total", "Status", "Payment", "Actions"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">No orders found</td></tr>
            ) : filtered.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 text-sm font-bold text-[#1e3a5f]">{inv.invoice_no}</td>
                <td className="px-5 py-4 text-sm text-gray-700">{inv.customers?.name || "Walk-in"}</td>
                <td className="px-5 py-4 text-xs text-gray-500">{new Date(inv.created_at).toLocaleDateString("en-IN")}</td>
                <td className="px-5 py-4 text-sm text-gray-600">—</td>
                <td className="px-5 py-4 text-sm font-bold text-gray-900">{formatINR(inv.total_amount)}</td>
                <td className="px-5 py-4"><Badge label={inv.status} map={STATUS_BADGE} /></td>
                <td className="px-5 py-4"><Badge label={inv.payment_status} map={PAYMENT_BADGE} /></td>
                <td className="px-5 py-4">
                  <button className="text-lg text-gray-400 hover:text-gray-600">···</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
