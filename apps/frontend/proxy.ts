import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const AUTH_ROUTES = ["/login", "/register"]
const SESSION_COOKIE = "campbridge_session"

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value)

  if (AUTH_ROUTES.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (!hasSession && !AUTH_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/cases/:path*", "/safety/:path*", "/map/:path*", "/settings/:path*", "/login", "/register"],
}
