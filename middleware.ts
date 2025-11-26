import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const protectedRoutes = ["/audit", "/deploy", "/history", "/settings"]

  // Check if route is protected
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    // In a real app, you'd check the session/auth token from cookies
    // For now, this is a placeholder - actual auth check would happen here
    const walletAccount = request.cookies.get("walletAccount")

    // Uncomment to enforce auth requirement
    // if (!walletAccount) {
    //   return NextResponse.redirect(new URL("/auth", request.url))
    // }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
