"use client"
import { toast } from "sonner"
export default function SettingsPage() {
  return (
    <div className="p-7 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your organisation and system preferences</p>
      </div>
      {[
        { title: "Organisation", fields: [["Business Name", "Kanakam Jewellers Pvt Ltd"], ["GSTIN", "27AABCK1234L1ZX"], ["City", "Mumbai"], ["State", "Maharashtra"], ["Phone", "9876543210"], ["Email", "admin@kanakam.in"]] },
        { title: "GST Configuration", fields: [["Default GST Rate", "3%"], ["GST Type", "CGST + SGST (Intra-state)"]] },
        { title: "Currency & Locale", fields: [["Currency", "INR (₹)"], ["Date Format", "DD/MM/YYYY"], ["Weight Unit", "Grams"]] },
      ].map((section) => (
        <div key={section.title} className="bg-white border border-gray-100 rounded-xl p-6 mb-4 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">{section.title}</h3>
          <div className="grid grid-cols-2 gap-4">
            {section.fields.map(([label, value]) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                <input defaultValue={value} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={() => toast.success("Settings saved!")}
        className="bg-[#1e3a5f] hover:bg-[#2a4f80] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors">
        Save Settings
      </button>
    </div>
  )
}
