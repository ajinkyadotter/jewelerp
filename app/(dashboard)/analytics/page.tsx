// app/(dashboard)/analytics/page.tsx
export default function AnalyticsPage() {
  return (
    <div className="p-7">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Business performance insights</p>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Revenue (YTD)", value: "₹28.4L", change: "+18% vs last year" },
          { label: "Avg Order Value", value: "₹42,300", change: "+6% vs last month" },
          { label: "Return Rate", value: "2.1%", change: "-0.4% vs last month" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-2">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">{s.value}</p>
            <p className="text-xs text-green-600">↗ {s.change}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-800 text-sm mb-4">Revenue by Category</h3>
          {[["Diamond Jewellery", 42, "₹11.9L", "#6366f1"], ["Gold Jewellery", 31, "₹8.8L", "#f59e0b"], ["Platinum", 15, "₹4.3L", "#94a3b8"], ["Silver", 12, "₹3.4L", "#10b981"]].map(([cat, pct, val, color]) => (
            <div key={cat as string} className="mb-4">
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-gray-600">{cat}</span>
                <span className="text-xs font-bold text-gray-800">{val} ({pct}%)</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div className="h-2 rounded-full" style={{ width: pct + "%", background: color as string }} />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-800 text-sm mb-4">Top Suppliers</h3>
          {[["Diamond Direct Inc", 48, "₹8.9L", 4.9], ["Gemstone World", 31, "₹5.4L", 4.7], ["Luxury Jewels Co", 22, "₹4.1L", 4.8], ["Premium Gems Ltd", 18, "₹2.9L", 4.5]].map(([name, orders, rev, rating]) => (
            <div key={name as string} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-b-0">
              <div>
                <p className="text-sm font-semibold text-gray-800">{name}</p>
                <p className="text-xs text-gray-400">{orders} orders · ⭐ {rating}</p>
              </div>
              <span className="text-sm font-bold text-[#1e3a5f]">{rev}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
