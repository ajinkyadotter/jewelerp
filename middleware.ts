import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
)

const PUBLIC_PATHS = ["/login", "/api/auth/login"]
const COOKIE_NAME = "jewelerp_session"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next()
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return NextResponse.next()
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.redirect(new URL("/login", req.url))
  try {
    const { payload } = await jwtVerify(token, secret)
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-user-id", payload.id as string)
    requestHeaders.set("x-user-role", payload.role as string)
    requestHeaders.set("x-org-id", payload.org_id as string)
    return NextResponse.next({ request: { headers: requestHeaders } })
  } catch {
    const res = NextResponse.redirect(new URL("/login", req.url))
    res.cookies.delete(COOKIE_NAME)
    return res
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
