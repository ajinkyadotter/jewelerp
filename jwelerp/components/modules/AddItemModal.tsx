"use client"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface Rate { id: string; metal_type: string; purity: string; rate_per_gram: number; custom_rate: number | null }

const STEPS = ["Basic Details", "Metal & Stones", "Pricing & Barcode", "Review & Save"]

export default function AddItemModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [rates, setRates] = useState<Rate[]>([])
  const [form, setForm] = useState({
    name: "", category: "Rings", description: "",
    metal_type: "Gold", purity: "22K",
    gross_weight: 10, net_weight: 9.5, wastage_percent: 5,
    making_charge_type: "PER_GRAM", making_charge_value: 450,
    stone_type: "", stone_carat: 0, stone_value: 0,
    gst_percent: 3, location: "", vendor: "", hsn_code: "7113",
  })

  useEffect(() => {
    fetch("/api/rates").then((r) => r.json()).then((d) => { if (d.success) setRates(d.data) })
  }, [])

  const currentRate = rates.find((r) => r.metal_type === form.metal_type && r.purity === form.purity)
  const ratePerGram = currentRate?.custom_rate ?? currentRate?.rate_per_gram ?? 0

  // Live price calculation
  const netWeight = form.net_weight || form.gross_weight * (1 - form.wastage_percent / 100)
  const metalValue = Math.round(netWeight * ratePerGram)
  let makingCharge = 0
  if (form.making_charge_type === "PER_GRAM") makingCharge = Math.round(netWeight * form.making_charge_value)
  else if (form.making_charge_type === "FIXED") makingCharge = form.making_charge_value
  else if (form.making_charge_type === "PERCENTAGE") makingCharge = Math.round(metalValue * (form.making_charge_value / 100))
  const subtotal = metalValue + makingCharge + (form.stone_value || 0)
  const gstAmount = Math.round(subtotal * (form.gst_percent / 100))
  const totalPrice = subtotal + gstAmount

  const fmtINR = (n: number) => "₹" + n.toLocaleString("en-IN")

  async function handleSave() {
    if (!form.name) { toast.error("Item name required"); setStep(1); return }
    setLoading(true)
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, net_weight: netWeight }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Item saved! SKU: ${data.data.sku}`)
      onClose()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inp = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f] bg-white"
  const lbl = "block text-xs font-semibold text-gray-600 mb-1.5"

  const purities = rates.filter((r) => r.metal_type === form.metal_type).map((r) => r.purity)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-7 pt-6 pb-5 border-b border-gray-100">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Add New Item</h2>
              <p className="text-xs text-gray-400 mt-0.5">Step {step} of {STEPS.length} — {STEPS[step - 1]}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-light leading-none mt-1">✕</button>
          </div>
          {/* Step indicator */}
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => i < step - 1 && setStep(i + 1)}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    step > i + 1 ? "bg-[#1e3a5f] text-white" : step === i + 1 ? "bg-[#1e3a5f] text-white" : "bg-gray-100 text-gray-400"
                  }`}>{step > i + 1 ? "✓" : i + 1}</div>
                  <span className={`text-xs whitespace-nowrap ${step === i + 1 ? "text-[#1e3a5f] font-semibold" : "text-gray-400"}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-7 py-6">
          {/* Step 1: Basic */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <div className="col-span-2">
                <label className={lbl}>Item Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Diamond Solitaire Engagement Ring" className={inp} />
                <p className="text-xs text-gray-400 mt-1">Give a descriptive name for this piece</p>
              </div>
              <div>
                <label className={lbl}>Category *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inp}>
                  {["Rings", "Necklaces", "Earrings", "Bangles", "Bracelets", "Pendants", "Chains", "Anklets", "Mangalsutra"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>HSN Code</label>
                <input value={form.hsn_code} onChange={(e) => setForm({ ...form, hsn_code: e.target.value })} className={inp} />
                <p className="text-xs text-gray-400 mt-1">Default 7113 for jewellery</p>
              </div>
              <div>
                <label className={lbl}>Location / Counter</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Counter A, Vault 1" className={inp} />
              </div>
              <div>
                <label className={lbl}>Vendor / Supplier</label>
                <input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  placeholder="Supplier name" className={inp} />
              </div>
              <div className="col-span-2">
                <label className={lbl}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description" rows={2}
                  className={inp + " resize-none"} />
              </div>
            </div>
          )}

          {/* Step 2: Metal & Stones */}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <div>
                <label className={lbl}>Metal Type *</label>
                <select value={form.metal_type} onChange={(e) => setForm({ ...form, metal_type: e.target.value, purity: "" })} className={inp}>
                  {[...new Set(rates.map((r) => r.metal_type))].map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Purity *</label>
                <select value={form.purity} onChange={(e) => setForm({ ...form, purity: e.target.value })} className={inp}>
                  {purities.map((p) => <option key={p}>{p}</option>)}
                </select>
                {ratePerGram > 0 && <p className="text-xs text-green-600 mt-1">Current rate: ₹{ratePerGram}/g</p>}
              </div>
              <div>
                <label className={lbl}>Gross Weight (g) *</label>
                <input type="number" step="0.001" value={form.gross_weight}
                  onChange={(e) => setForm({ ...form, gross_weight: +e.target.value })} className={inp} />
              </div>
              <div>
                <label className={lbl}>Net Weight (g)</label>
                <input type="number" step="0.001" value={form.net_weight}
                  onChange={(e) => setForm({ ...form, net_weight: +e.target.value })} className={inp} />
                <p className="text-xs text-gray-400 mt-1">Leave 0 to auto-calculate from wastage</p>
              </div>
              <div>
                <label className={lbl}>Wastage %</label>
                <input type="number" step="0.1" value={form.wastage_percent}
                  onChange={(e) => setForm({ ...form, wastage_percent: +e.target.value })} className={inp} />
              </div>
              <div>
                <label className={lbl}>Making Charge Type</label>
                <select value={form.making_charge_type} onChange={(e) => setForm({ ...form, making_charge_type: e.target.value })} className={inp}>
                  <option value="PER_GRAM">Per Gram</option>
                  <option value="FIXED">Fixed Amount</option>
                  <option value="PERCENTAGE">Percentage of Metal Value</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Making Charge Value</label>
                <input type="number" value={form.making_charge_value}
                  onChange={(e) => setForm({ ...form, making_charge_value: +e.target.value })} className={inp} />
                <p className="text-xs text-gray-400 mt-1">
                  {form.making_charge_type === "PER_GRAM" ? "₹ per gram" : form.making_charge_type === "PERCENTAGE" ? "% of metal value" : "Fixed ₹ amount"}
                </p>
              </div>
              <div className="col-span-2 border-t border-gray-100 pt-4 mt-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Stone Details (optional)</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={lbl}>Stone Type</label>
                    <select value={form.stone_type} onChange={(e) => setForm({ ...form, stone_type: e.target.value })} className={inp}>
                      {["", "Diamond", "Ruby", "Emerald", "Sapphire", "Pearl", "Other"].map((s) => <option key={s} value={s}>{s || "None"}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Stone Carat</label>
                    <input type="number" step="0.01" value={form.stone_carat} onChange={(e) => setForm({ ...form, stone_carat: +e.target.value })} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Stone Value (₹)</label>
                    <input type="number" value={form.stone_value} onChange={(e) => setForm({ ...form, stone_value: +e.target.value })} className={inp} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Pricing */}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-5">
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-4">Live Price Calculation</h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {[
                    { label: `${form.metal_type} Rate (${form.purity})`, value: `₹${ratePerGram}/g` },
                    { label: `Metal Value (${netWeight.toFixed(3)}g)`, value: fmtINR(metalValue) },
                    { label: "Making Charge", value: fmtINR(makingCharge) },
                    { label: "Stone Value", value: fmtINR(form.stone_value || 0) },
                    { label: "Subtotal", value: fmtINR(subtotal), bold: true },
                    { label: `GST (${form.gst_percent}%)`, value: fmtINR(gstAmount) },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 last:border-b-0">
                      <span className="text-xs text-gray-500">{row.label}</span>
                      <span className={`text-sm font-mono ${row.bold ? "font-bold text-gray-900" : "text-gray-700"}`}>{row.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-4 py-3.5 bg-[#1e3a5f]">
                    <span className="text-sm font-bold text-white">Final Price</span>
                    <span className="text-lg font-bold text-white font-mono">{fmtINR(totalPrice)}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <label className={lbl}>GST %</label>
                  <select value={form.gst_percent} onChange={(e) => setForm({ ...form, gst_percent: +e.target.value })}
                    className={inp}>
                    <option value={3}>3% (Jewellery - standard)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                  </select>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-4">Barcode Preview</h4>
                <div className="border border-gray-200 rounded-xl p-5">
                  <div className="bg-white border border-gray-100 rounded-lg p-4 mb-4 text-center">
                    <svg viewBox="0 0 200 60" className="w-full">
                      {Array.from({ length: 45 }, (_, i) => (
                        <rect key={i} x={i * 4.4} y={0} width={i % 3 === 0 ? 3 : 2} height={48}
                          fill={i % 5 === 0 ? "#555" : "#111"} opacity={i % 7 === 0 ? 0.5 : 1} />
                      ))}
                      <text x={100} y={57} textAnchor="middle" fontSize={7} fill="#374151" fontFamily="monospace">
                        JWL-AUTO-{String(Math.floor(Math.random() * 99999)).padStart(5, "0")}
                      </text>
                    </svg>
                  </div>
                  <p className="text-xs text-gray-400 text-center">Auto-generated on save</p>
                  <div className="mt-3 space-y-2.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Category</span>
                      <span className="font-semibold text-gray-800">{form.category}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Metal</span>
                      <span className="font-semibold text-gray-800">{form.metal_type} {form.purity}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">HSN Code</span>
                      <span className="font-semibold text-gray-800">{form.hsn_code}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 mb-5">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-bold text-green-700 text-sm">Ready to save</p>
                  <p className="text-green-600 text-xs mt-0.5">Review details below and click Save Item</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Item Name", form.name || "—"],
                  ["Category", form.category],
                  ["Metal & Purity", `${form.metal_type} ${form.purity}`],
                  ["Gross Weight", `${form.gross_weight}g`],
                  ["Net Weight", `${netWeight.toFixed(3)}g`],
                  ["Making Charge", fmtINR(makingCharge)],
                  ["Stone Value", fmtINR(form.stone_value || 0)],
                  ["GST Amount", fmtINR(gstAmount)],
                  ["HSN Code", form.hsn_code],
                  ["Location", form.location || "Not set"],
                ].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">{k}</p>
                    <p className="text-sm font-semibold text-gray-800">{v}</p>
                  </div>
                ))}
                <div className="col-span-2 bg-[#1e3a5f] rounded-xl p-4 flex justify-between items-center">
                  <span className="text-white font-bold">Final Price</span>
                  <span className="text-white text-xl font-bold font-mono">{fmtINR(totalPrice)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-gray-100 flex justify-between bg-gray-50 rounded-b-2xl">
          <button onClick={step === 1 ? onClose : () => setStep((s) => s - 1)}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 bg-white transition-colors font-medium">
            {step === 1 ? "Cancel" : "← Back"}
          </button>
          {step < 4 ? (
            <button onClick={() => { if (step === 1 && !form.name) { toast.error("Item name is required"); return } setStep((s) => s + 1) }}
              className="px-6 py-2.5 bg-[#1e3a5f] hover:bg-[#2a4f80] text-white rounded-xl text-sm font-bold transition-colors">
              Save & Continue →
            </button>
          ) : (
            <button onClick={handleSave} disabled={loading}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60">
              {loading ? "Saving…" : "✓ Save Item"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
