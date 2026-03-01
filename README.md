# 💎 JewelERP — Full Stack Jewellery Management System

## 🚀 Deploy in 10 Minutes

### Step 1 — Create Supabase Project (2 min)
1. Go to [supabase.com](https://supabase.com) → New Project
2. Note your **Project URL** and **anon key** from Settings → API
3. Note your **service_role key** from Settings → API
4. Go to **SQL Editor** → paste the entire contents of `supabase-schema.sql` → Run

### Step 2 — Deploy to Vercel (3 min)
1. Push this folder to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your repo
3. Add these Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL     = https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
   SUPABASE_SERVICE_ROLE_KEY    = eyJ...
   JWT_SECRET                   = any-random-64-char-string
   ```
4. Click Deploy → Done! ✅

### Step 3 — Login
- URL: `https://your-app.vercel.app/login`
- Email: `admin@kanakam.in`
- Password: `Admin@1234`

---

## 🏃 Run Locally

```bash
cp .env.local.example .env.local
# Fill in your Supabase credentials

npm install
npm run dev
# Open http://localhost:3000
```

---

## 📁 Project Structure

```
app/
├── (auth)/login/          Login page
├── (dashboard)/
│   ├── layout.tsx          Protected layout (auth check)
│   ├── dashboard/          Dashboard with stats + charts
│   ├── inventory/          Inventory table + add item
│   ├── sales/              Invoices list
│   ├── production/         Manufacturing jobs
│   ├── rates/              Metal rates master (editable)
│   ├── analytics/          Revenue charts
│   └── settings/           Org config
├── api/
│   ├── auth/login/         POST - login
│   ├── auth/me/            GET - current user, POST - logout
│   ├── inventory/          GET list, POST create
│   ├── inventory/[id]/     GET, PUT, DELETE single item
│   ├── sales/              GET list, POST create invoice
│   ├── customers/          GET list, POST create
│   ├── rates/              GET list, PUT update rate
│   ├── rfid/               GET list, POST assign/remove
│   └── dashboard/          GET aggregated stats
lib/
├── supabase.ts             Supabase clients (browser + admin)
├── auth.ts                 JWT + RBAC + password hashing
├── pricing.ts              Jewellery pricing engine
├── api.ts                  Response helpers
└── utils.ts                Formatters
components/
├── layout/Sidebar.tsx      Collapsible nav sidebar
├── layout/Topbar.tsx       Search + user menu
└── modules/AddItemModal.tsx 4-step add item wizard
```

---

## 🔐 Security Features
- JWT auth with httpOnly cookies
- RBAC (Admin/Manager/Staff/Accountant)
- Server-side permission checks on every API route
- Zod validation on all inputs
- Supabase Row Level Security (RLS) + admin client
- Password hashing with bcrypt (12 rounds)
- Soft delete (no hard deletes)

---

## 💰 Indian Jewellery Pricing Logic
```
Metal Value = Net Weight × Rate per gram
Making Charge = Per Gram | Fixed | % of metal value
Stone Value = manual entry
Subtotal = Metal + Making + Stone
GST (3%) = Subtotal × 0.03
  → CGST 1.5% + SGST 1.5% (intra-state)
  → IGST 3% (inter-state)
Final Price = Subtotal + GST
```

---

## 🧪 Test Credentials
| Role     | Email                 | Password    |
|----------|-----------------------|-------------|
| Admin    | admin@kanakam.in      | Admin@1234  |
