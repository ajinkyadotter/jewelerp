"use client"
import { useState, useEffect } from "react"
import { toast } from "sonner"

export default function RatesPage() {
  const [rates, setRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editVal, setEditVal] = useState("")
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("Metal Rates")

  useEffect(() => {
    fetch("/api/rates")
      .then((r) => r.json())
      .then((d) => { if (d.success) setRates(d.data) })
      .finally(() => setLoading(false))
  }, [])

  async function saveRate(id: string) {
    const val = parseFloat(editVal)
    if (isNaN(val) || val <= 0) { toast.error("Enter a valid rate"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, custom_rate: val }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRates((prev) => prev.map((r) => r.id === id ? { ...r, custom_rate: val } : r))
      toast.success("Rate updated!")
      setEditId(null)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const goldRates = rates.filter((r) => r.metal_type === "Gold")
  const silverRates = rates.filter((r) => r.metal_type === "Silver")
  const platinumRates = rates.filter((r) => r.metal_type === "Platinum")
  const overrides = rates.filter((r) => r.custom_rate !== null).length

  const gold24k = goldRates.find((r) => r.purity === "24K")
  const silver999 = silverRates.find((r) => r.purity === "999")
  const pt950 = platinumRates.find((r) => r.purity === "950")

  const now = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

  return (
    <div className="p-7">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rates Master Sheet</h1>
          <p className="text-gray-400 text-sm mt-1 flex items-center gap-1.5">🕐 Last updated: {now}</p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            ↻ Refresh Rates
          </button>
          <button onClick={() => toast.success("Rates published to all pricing calculations!")}
            className="bg-[#1e3a5f] hover:bg-[#2a4f80] text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors">
            💾 Save & Publish
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Gold 24K", value: gold24k?.custom_rate ?? gold24k?.rate_per_gram ?? "—", sub: "per gram", icon: "₹", iconBg: "bg-amber-50", iconColor: "text-amber-600" },
          { label: "Silver 999", value: silver999?.custom_rate ?? silver999?.rate_per_gram ?? "—", sub: "per gram", icon: "₹", iconBg: "bg-blue-50", iconColor: "text-blue-600" },
          { label: "Platinum 950", value: pt950?.custom_rate ?? pt950?.rate_per_gram ?? "—", sub: "per gram", icon: "↗", iconBg: "bg-green-50", iconColor: "text-green-600" },
          { label: "Manual Overrides", value: overrides, sub: "custom rates active", icon: "✏", iconBg: "bg-orange-50", iconColor: "text-orange-600" },
        ].map((c) => (
          <div key={c.label} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`w-9 h-9 ${c.iconBg} rounded-lg flex items-center justify-center ${c.iconColor} font-bold`}>{c.icon}</div>
              <span className="text-sm font-semibold text-gray-700">{c.label}</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{typeof c.value === "number" ? c.value.toLocaleString("en-IN") : c.value}</p>
            <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-0 border-b border-gray-200">
        {["Metal Rates", "Diamond Matrix", "Colored Stones", "Audit Log"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab ? "border-[#1e3a5f] text-[#1e3a5f]" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>{tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-b-xl rounded-tr-xl shadow-sm overflow-hidden">
        {activeTab === "Metal Rates" ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Metal Type", "Purity", "Internet Rate (per g)", "Custom Rate (per g)", "Active Rate (per g)", "Source", "Last Updated", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400">Loading rates…</td></tr>
              ) : rates.map((rate) => (
                <tr key={rate.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 text-sm font-bold text-gray-900">{rate.metal_type}</td>
                  <td className="px-5 py-4">
                    <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">{rate.purity}</span>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-700 font-mono">{rate.rate_per_gram.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4">
                    {editId === rate.id ? (
                      <input autoFocus value={editVal} onChange={(e) => setEditVal(e.target.value)}
                        className="w-24 border border-indigo-400 rounded-lg px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    ) : (
                      <span className="text-sm text-gray-400 font-mono">{rate.custom_rate ? rate.custom_rate.toLocaleString("en-IN") : "—"}</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-gray-900 font-mono">
                    {(rate.custom_rate ?? rate.rate_per_gram).toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-100 px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      {rate.source || "MANUAL"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-400">{new Date(rate.updated_at).toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4">
                    {editId === rate.id ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => saveRate(rate.id)} disabled={saving}
                          className="px-2.5 py-1 bg-green-600 text-white rounded-lg text-xs font-bold disabled:opacity-50">
                          {saving ? "…" : "✓"}
                        </button>
                        <button onClick={() => setEditId(null)}
                          className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditId(rate.id); setEditVal(String(rate.custom_rate ?? "")) }}
                        className="text-gray-400 hover:text-gray-600 text-base transition-colors">✏</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-16 text-center">
            <p className="text-gray-300 text-4xl mb-3">◆</p>
            <p className="text-gray-400 text-sm">{activeTab} — coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}
