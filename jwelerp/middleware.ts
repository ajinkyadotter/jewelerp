import { NextRequest, NextResponse } from "next/server"
import { verifyToken, COOKIE_NAME } from "@/lib/auth"

const PUBLIC_PATHS = ["/login", "/api/auth/login"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow static files
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next()
  }

  // Check auth cookie
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const user = await verifyToken(token)
  if (!user) {
    const res = NextResponse.redirect(new URL("/login", req.url))
    res.cookies.delete(COOKIE_NAME)
    return res
  }

  // Attach user info to headers for API routes
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-user-id", user.id)
  requestHeaders.set("x-user-role", user.role)
  requestHeaders.set("x-org-id", user.org_id)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
