import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
)

export type UserRole = "ADMIN" | "MANAGER" | "STAFF" | "ACCOUNTANT"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  org_id: string
}

// ── Token ────────────────────────────────────────

export async function signToken(payload: AuthUser): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as AuthUser
  } catch {
    return null
  }
}

// ── Password ─────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ── Cookie ───────────────────────────────────────

export const COOKIE_NAME = "jewelerp_session"

export async function getAuthFromCookie(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getAuthFromRequest(req: NextRequest): Promise<AuthUser | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

// ── RBAC ─────────────────────────────────────────

type Permission =
  | "inventory:read" | "inventory:write" | "inventory:delete"
  | "sales:read" | "sales:write" | "sales:cancel"
  | "customers:read" | "customers:write"
  | "rfid:read" | "rfid:write"
  | "rates:read" | "rates:write"
  | "reports:read" | "reports:financial"
  | "users:read" | "users:write"
  | "settings:read" | "settings:write"

const PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    "inventory:read","inventory:write","inventory:delete",
    "sales:read","sales:write","sales:cancel",
    "customers:read","customers:write",
    "rfid:read","rfid:write",
    "rates:read","rates:write",
    "reports:read","reports:financial",
    "users:read","users:write",
    "settings:read","settings:write",
  ],
  MANAGER: [
    "inventory:read","inventory:write",
    "sales:read","sales:write","sales:cancel",
    "customers:read","customers:write",
    "rfid:read","rfid:write",
    "rates:read","rates:write",
    "reports:read","reports:financial",
    "users:read","settings:read",
  ],
  STAFF: [
    "inventory:read","sales:read","sales:write",
    "customers:read","customers:write","rfid:read","rates:read",
  ],
  ACCOUNTANT: [
    "inventory:read","sales:read","customers:read",
    "reports:read","reports:financial","rates:read",
  ],
}

export function can(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false
}
