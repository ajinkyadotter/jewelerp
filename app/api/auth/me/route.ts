import { NextResponse } from "next/server"
import { COOKIE_NAME, getAuthFromCookie } from "@/lib/auth"
import { ok, unauthorized } from "@/lib/api"

// GET /api/auth/me
export async function GET() {
  const user = await getAuthFromCookie()
  if (!user) return unauthorized()
  return ok(user)
}

// POST /api/auth/logout
export async function POST() {
  const res = ok({ message: "Logged out" })
  res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" })
  return res
}
