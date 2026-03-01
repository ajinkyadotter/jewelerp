-- ================================================================
-- JEWEL ERP — SUPABASE SQL SCHEMA
-- Paste this entire file into Supabase → SQL Editor → Run
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Organizations ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  gstin       TEXT,
  address     TEXT,
  city        TEXT,
  state       TEXT,
  phone       TEXT,
  email       TEXT,
  plan        TEXT DEFAULT 'STARTER',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Users ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  phone         TEXT,
  role          TEXT NOT NULL DEFAULT 'STAFF' CHECK (role IN ('ADMIN','MANAGER','STAFF','ACCOUNTANT')),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, email)
);

-- ── Metal Rates ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS metal_rates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metal_type    TEXT NOT NULL,
  purity        TEXT NOT NULL,
  rate_per_gram NUMERIC(10,2) NOT NULL,
  custom_rate   NUMERIC(10,2),
  source        TEXT DEFAULT 'MANUAL',
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Category Master ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  code     TEXT NOT NULL,
  hsn_code TEXT DEFAULT '7113',
  UNIQUE(org_id, code)
);

-- ── Inventory Items ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_items (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id               UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sku                  TEXT UNIQUE NOT NULL,
  barcode              TEXT UNIQUE NOT NULL,
  name                 TEXT NOT NULL,
  description          TEXT,
  category             TEXT NOT NULL,
  metal_type           TEXT,
  purity               TEXT,
  gross_weight         NUMERIC(10,3),
  net_weight           NUMERIC(10,3),
  wastage_percent      NUMERIC(5,2) DEFAULT 0,
  making_charge_type   TEXT CHECK (making_charge_type IN ('PER_GRAM','FIXED','PERCENTAGE')),
  making_charge_value  NUMERIC(10,2),
  stone_type           TEXT,
  stone_carat          NUMERIC(8,3),
  stone_value          NUMERIC(10,2) DEFAULT 0,
  metal_value          NUMERIC(10,2),
  making_charge        NUMERIC(10,2),
  subtotal             NUMERIC(10,2),
  gst_percent          NUMERIC(5,2) DEFAULT 3,
  gst_amount           NUMERIC(10,2),
  final_price          NUMERIC(10,2),
  status               TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE','SOLD','RESERVED','REPAIR')),
  location             TEXT,
  vendor               TEXT,
  hsn_code             TEXT DEFAULT '7113',
  images               TEXT[] DEFAULT '{}',
  tags                 TEXT[] DEFAULT '{}',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_inventory_org ON inventory_items(org_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_items(org_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_barcode ON inventory_items(barcode);

-- ── Customers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  phone           TEXT,
  email           TEXT,
  gstin           TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  loyalty_points  INTEGER DEFAULT 0,
  total_purchase  NUMERIC(12,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(org_id);

-- ── Vendors ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  contact_name TEXT,
  phone        TEXT,
  email        TEXT,
  gstin        TEXT,
  city         TEXT,
  state        TEXT,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Invoices ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_no     TEXT NOT NULL,
  customer_id    UUID REFERENCES customers(id),
  created_by     UUID NOT NULL REFERENCES users(id),
  subtotal       NUMERIC(12,2) NOT NULL DEFAULT 0,
  cgst           NUMERIC(10,2) DEFAULT 0,
  sgst           NUMERIC(10,2) DEFAULT 0,
  igst           NUMERIC(10,2) DEFAULT 0,
  discount       NUMERIC(10,2) DEFAULT 0,
  total_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount    NUMERIC(12,2) DEFAULT 0,
  balance        NUMERIC(12,2) DEFAULT 0,
  status         TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','CONFIRMED','CANCELLED')),
  payment_status TEXT DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID','PARTIAL','PAID')),
  payment_method TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, invoice_no)
);

CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(org_id, payment_status);

-- ── Invoice Items ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_id     UUID REFERENCES inventory_items(id),
  name        TEXT NOT NULL,
  quantity    INTEGER DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL,
  gst_percent NUMERIC(5,2) DEFAULT 3,
  gst_amount  NUMERIC(10,2) DEFAULT 0,
  total       NUMERIC(10,2) NOT NULL
);

-- ── Payments ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id     UUID NOT NULL REFERENCES organizations(id),
  invoice_id UUID REFERENCES invoices(id),
  amount     NUMERIC(12,2) NOT NULL,
  method     TEXT NOT NULL CHECK (method IN ('CASH','CARD','UPI','NEFT','CHEQUE','EMI')),
  reference  TEXT,
  paid_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── RFID Tags ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rfid_tags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tag_uid     TEXT UNIQUE NOT NULL,
  item_id     UUID UNIQUE REFERENCES inventory_items(id),
  status      TEXT DEFAULT 'UNASSIGNED' CHECK (status IN ('UNASSIGNED','ACTIVE','REMOVED','LOST')),
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── RFID Logs ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rfid_logs (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id    UUID NOT NULL REFERENCES organizations(id),
  tag_id    UUID NOT NULL REFERENCES rfid_tags(id),
  item_id   UUID REFERENCES inventory_items(id),
  user_id   UUID REFERENCES users(id),
  action    TEXT NOT NULL,
  notes     TEXT,
  ts        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Production Jobs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS production_jobs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_no       TEXT NOT NULL,
  item_name    TEXT NOT NULL,
  customer_id  UUID REFERENCES customers(id),
  due_date     DATE,
  progress     INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  status       TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','IN_PROGRESS','COMPLETED','CANCELLED')),
  notes        TEXT,
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Auto-update trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_inventory_updated BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Seed: Demo Organisation + Admin ──────────────────────────
INSERT INTO organizations (name, slug, gstin, city, state, phone, email)
VALUES ('Kanakam Jewellers', 'kanakam', '27AABCK1234L1ZX', 'Mumbai', 'Maharashtra', '9876543210', 'admin@kanakam.in')
ON CONFLICT (slug) DO NOTHING;

-- Admin user (password: Admin@1234  → bcrypt hash below)
INSERT INTO users (org_id, email, password_hash, first_name, last_name, role)
SELECT id, 'admin@kanakam.in',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXIG/QOfABuy',
  'Admin', 'User', 'ADMIN'
FROM organizations WHERE slug = 'kanakam'
ON CONFLICT DO NOTHING;

-- Metal rates seed
INSERT INTO metal_rates (org_id, metal_type, purity, rate_per_gram)
SELECT id, 'Gold', '24K', 7250 FROM organizations WHERE slug = 'kanakam' ON CONFLICT DO NOTHING;
INSERT INTO metal_rates (org_id, metal_type, purity, rate_per_gram)
SELECT id, 'Gold', '22K', 6645 FROM organizations WHERE slug = 'kanakam' ON CONFLICT DO NOTHING;
INSERT INTO metal_rates (org_id, metal_type, purity, rate_per_gram)
SELECT id, 'Gold', '18K', 5437 FROM organizations WHERE slug = 'kanakam' ON CONFLICT DO NOTHING;
INSERT INTO metal_rates (org_id, metal_type, purity, rate_per_gram)
SELECT id, 'Gold', '14K', 4234 FROM organizations WHERE slug = 'kanakam' ON CONFLICT DO NOTHING;
INSERT INTO metal_rates (org_id, metal_type, purity, rate_per_gram)
SELECT id, 'Silver', '999', 92 FROM organizations WHERE slug = 'kanakam' ON CONFLICT DO NOTHING;
INSERT INTO metal_rates (org_id, metal_type, purity, rate_per_gram)
SELECT id, 'Silver', '925', 85 FROM organizations WHERE slug = 'kanakam' ON CONFLICT DO NOTHING;
INSERT INTO metal_rates (org_id, metal_type, purity, rate_per_gram)
SELECT id, 'Platinum', '950', 3100 FROM organizations WHERE slug = 'kanakam' ON CONFLICT DO NOTHING;
