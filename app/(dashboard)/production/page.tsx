"use client"
const jobs = [
  { id: "JOB-001", item: "Bridal Necklace Set", customer: "Anita Patel", due: "2026-03-15", progress: 75, status: "IN_PROGRESS" },
  { id: "JOB-002", item: "Custom Engagement Ring", customer: "Vikram Shah", due: "2026-03-10", progress: 40, status: "IN_PROGRESS" },
  { id: "JOB-003", item: "Gold Bangles (6pc)", customer: "Sunita Devi", due: "2026-03-05", progress: 100, status: "COMPLETED" },
  { id: "JOB-004", item: "Platinum Wedding Band", customer: "Rohan Mehta", due: "2026-03-20", progress: 15, status: "PENDING" },
]
const STATUS_BADGE: Record<string, string> = {
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
  COMPLETED: "bg-green-100 text-green-700 border-green-200",
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
}
export default function ProductionPage() {
  return (
    <div className="p-7">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production</h1>
          <p className="text-gray-500 text-sm mt-1">Track custom orders and manufacturing jobs</p>
        </div>
        <button className="bg-[#1e3a5f] text-white px-4 py-2.5 rounded-lg text-sm font-bold">+ New Job</button>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[["Active Jobs", "2", "text-blue-600"], ["Pending", "1", "text-amber-600"], ["Completed", "1", "text-green-600"], ["Avg Lead Time", "12 days", "text-gray-900"]].map(([l, v, c]) => (
          <div key={l as string} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <p className="text-xs text-gray-500 mb-2">{l}</p>
            <p className={`text-2xl font-bold ${c}`}>{v}</p>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Job ID", "Item", "Customer", "Due Date", "Progress", "Status"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 text-sm font-bold text-[#1e3a5f]">{job.id}</td>
                <td className="px-5 py-4 text-sm text-gray-800">{job.item}</td>
                <td className="px-5 py-4 text-sm text-gray-600">{job.customer}</td>
                <td className="px-5 py-4 text-xs text-gray-500">{job.due}</td>
                <td className="px-5 py-4 w-40">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full">
                      <div className={`h-2 rounded-full ${job.progress === 100 ? "bg-green-500" : "bg-blue-500"}`} style={{ width: job.progress + "%" }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 w-8">{job.progress}%</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_BADGE[job.status]}`}>
                    {job.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
