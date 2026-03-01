// ── Jewellery Pricing Engine ─────────────────────

export type MakingChargeType = "PER_GRAM" | "FIXED" | "PERCENTAGE"

export interface PricingInput {
  metalType?: string
  purity?: string
  netWeight?: number
  grossWeight?: number
  wastagePercent?: number
  makingChargeType?: MakingChargeType
  makingChargeValue?: number
  stoneValue?: number
  gstPercent?: number
  metalRatePerGram?: number
}

export interface PricingResult {
  netWeight: number
  metalValue: number
  makingCharge: number
  stoneValue: number
  subtotal: number
  gstAmount: number
  cgst: number
  sgst: number
  igst: number
  totalPrice: number
}

export function calculatePrice(input: PricingInput, isInterState = false): PricingResult {
  const {
    netWeight: nw,
    grossWeight = 0,
    wastagePercent = 0,
    makingChargeType,
    makingChargeValue = 0,
    stoneValue = 0,
    gstPercent = 3,
    metalRatePerGram = 0,
  } = input

  const netWeight = nw ?? grossWeight * (1 - wastagePercent / 100)
  const metalValue = round2(netWeight * metalRatePerGram)

  let makingCharge = 0
  if (makingChargeType === "PER_GRAM") makingCharge = round2(netWeight * makingChargeValue)
  else if (makingChargeType === "FIXED") makingCharge = round2(makingChargeValue)
  else if (makingChargeType === "PERCENTAGE") makingCharge = round2(metalValue * (makingChargeValue / 100))

  const subtotal = round2(metalValue + makingCharge + stoneValue)
  const gstAmount = round2(subtotal * (gstPercent / 100))

  const cgst = isInterState ? 0 : round2(gstAmount / 2)
  const sgst = isInterState ? 0 : round2(gstAmount / 2)
  const igst = isInterState ? gstAmount : 0

  return {
    netWeight,
    metalValue,
    makingCharge,
    stoneValue,
    subtotal,
    gstAmount,
    cgst,
    sgst,
    igst,
    totalPrice: round2(subtotal + gstAmount),
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

// ── SKU / Barcode generation ──────────────────────

export function generateSKU(categoryCode: string, metalCode: string, seq: number): string {
  return `${categoryCode.slice(0, 3).toUpperCase()}-${metalCode.slice(0, 2).toUpperCase()}-${String(seq).padStart(5, "0")}`
}

export function generateBarcode(orgCode: string, seq: number): string {
  return `JWL${orgCode.slice(0, 3).toUpperCase()}${String(seq).padStart(8, "0")}`
}
