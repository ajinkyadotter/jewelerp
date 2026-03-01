"use client"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import { formatINR } from "@/lib/utils"
import AddItemModal from "@/components/modules/AddItemModal"

type Status = "AVAILABLE" | "SOLD" | "RESERVED" | "REPAIR"

const STATUS_BADGE: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-700 border-green-200",
  SOLD: "bg-red-100 text-red-700 border-red-200",
  RESERVED: "bg-yellow-100 text-yellow-700 border-yellow-200",
  REPAIR: "bg-purple-100 text-purple-700 border-purple-200",
}

export default function InventoryPage() {
  const searchParams = useSearchParams()
  const [items, setItems] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)
  const [showAdd, setShowAdd] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (search) params.set("search", search)
      if (status) params.set("status", status)
      const res = await fetch(`/api/inventory?${params}`)
      const data = await res.json()
      if (data.success) { setItems(data.data.items); setTotal(data.data.total) }
    } catch { toast.error("Failed to load inventory") }
    finally { setLoading(false) }
  }, [search, status, page])

  useEffect(() => { fetchItems() }, [fetchItems])

  async function deleteItem(id: string) {
    if (!confirm("Delete this item?")) return
    const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Item deleted"); fetchItems() }
    else toast.error("Failed to delete")
  }

  return (
    <div className="p-7">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your jewellery inventory with detailed specifications</p>
        </div>
        <div className="flex gap-2.5">
          <button className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            📷 Scan Barcode
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#2a4f80] text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors">
            + Add Item
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 flex gap-3 items-center shadow-sm">
        <span className="text-gray-400">🔍</span>
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by SKU, name, barcode, metal..."
          className="flex-1 text-sm text-gray-700 outline-none bg-transparent placeholder-gray-400" />
        <button onClick={fetchItems}
          className="bg-[#1e3a5f] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#2a4f80] transition-colors">
          Search
        </button>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[["", "All"], ["AVAILABLE", "Available"], ["RESERVED", "Reserved"], ["SOLD", "Sold"], ["REPAIR", "Repair"]].map(([v, l]) => (
          <button key={v} onClick={() => { setStatus(v); setPage(1) }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              status === v ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}>{l}</button>
        ))}
        <span className="ml-auto text-xs text-gray-400 self-center">{total} items</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table" style={{ minWidth: 1100 }}>
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["SKU", "Name", "Category", "Metal/Purity", "Gross Wt", "Net Wt", "Final Price", "Status", "Location", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                  No items found. <button onClick={() => setShowAdd(true)} className="text-[#1e3a5f] font-semibold hover:underline">Add your first item →</button>
                </td></tr>
              ) : items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5 text-xs font-mono font-bold text-[#1e3a5f] whitespace-nowrap">{item.sku}</td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-gray-800 max-w-[180px] truncate">{item.name}</p>
                    {item.hsn_code && <p className="text-xs text-gray-400">HSN: {item.hsn_code}</p>}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">{item.category}</td>
                  <td className="px-4 py-3.5 text-sm whitespace-nowrap">
                    <span className="text-amber-600 font-semibold">{item.metal_type}</span>
                    {item.purity && <span className="text-gray-400"> · {item.purity}</span>}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-600 font-mono whitespace-nowrap">{item.gross_weight ? item.gross_weight + "g" : "—"}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-600 font-mono whitespace-nowrap">{item.net_weight ? (+item.net_weight).toFixed(3) + "g" : "—"}</td>
                  <td className="px-4 py-3.5 text-sm font-bold text-gray-900 whitespace-nowrap">{item.final_price ? formatINR(item.final_price) : "—"}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_BADGE[item.status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 max-w-[100px] truncate">{item.location || "—"}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors" title="View">👁</button>
                      <button className="p-1.5 rounded-lg bg-gray-50 hover:bg-yellow-50 text-gray-500 hover:text-yellow-600 transition-colors" title="Edit">✏</button>
                      <button onClick={() => deleteItem(item.id)}
                        className="p-1.5 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors" title="Delete">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-white bg-gray-50">← Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-40 hover:bg-white bg-gray-50">Next →</button>
            </div>
          </div>
        )}
      </div>

      {showAdd && <AddItemModal onClose={() => { setShowAdd(false); fetchItems() }} />}
    </div>
  )
}
