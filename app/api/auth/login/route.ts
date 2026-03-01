import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabase"
import { verifyPassword, signToken, COOKIE_NAME } from "@/lib/auth"
import { ok, err } from "@/lib/api"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) return err("Invalid email or password")

    const { email, password } = parsed.data

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .single()

    if (error || !user) return err("Invalid email or password", 401)

    const userRecord = user as any
    const valid = await verifyPassword(password, userRecord.password_hash)
    if (!valid) return err("Invalid email or password", 401)

    const token = await signToken({
      id: userRecord.id,
      email: userRecord.email,
      name: `${userRecord.first_name} ${userRecord.last_name}`,
      role: userRecord.role,
      org_id: userRecord.org_id,
    })

    const response = ok({ user: { id: userRecord.id, email: userRecord.email, name: `${userRecord.first_name} ${userRecord.last_name}`, role: userRecord.role } })
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return response
  } catch (e) {
    return err("Server error", 500)
  }
}
