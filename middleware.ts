import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySession } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Redirect root to auth if not authenticated
  if (pathname === "/") {
    const token = request.cookies.get("session")?.value
    const session = token ? await verifySession(token) : null
    
    if (!session) {
      return NextResponse.redirect(new URL("/auth", request.url))
    }
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  const protectedRoutes = ["/dashboard", "/audit", "/deploy", "/badges", "/reputation", "/merkle-proof","/registry", "/subscription", "/accounts"]

  // Check if route is protected
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const token = request.cookies.get("session")?.value
    
    if (!token) {
      return NextResponse.redirect(new URL("/auth", request.url))
    }

    const session = await verifySession(token)
    
    if (!session) {
      return NextResponse.redirect(new URL("/auth", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
}