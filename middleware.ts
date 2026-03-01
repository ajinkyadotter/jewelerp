import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret"
)

const COOKIE_NAME = "jewelerp_session"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  try {
    const { payload } = await jwtVerify(token, secret)
    const headers = new Headers(req.headers)
    headers.set("x-user-id", String(payload.id))
    headers.set("x-user-role", String(payload.role))
    headers.set("x-org-id", String(payload.org_id))
    return NextResponse.next({ request: { headers } })
  } catch {
    const res = NextResponse.redirect(new URL("/login", req.url))
    res.cookies.delete(COOKIE_NAME)
    return res
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
