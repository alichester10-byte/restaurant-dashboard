import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/dashboard", "/reservations", "/tables", "/customers", "/reports", "/settings", "/billing", "/integrations", "/super-admin", "/admin"];
const publicBillingPaths = new Set([
  "/billing/success",
  "/billing/fail",
  "/billing/result/success",
  "/billing/result/fail"
]);

function withSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  return response;
}

export function middleware(request: NextRequest) {
  const session = request.cookies.get("restaurant_ops_session")?.value;
  const { pathname } = request.nextUrl;

  const isPublicBillingPath = publicBillingPaths.has(pathname);
  const isProtected = !isPublicBillingPath && protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected && !session) {
    return withSecurityHeaders(NextResponse.redirect(new URL("/login", request.url)));
  }

  if (pathname === "/login" && session) {
    return withSecurityHeaders(NextResponse.redirect(new URL("/", request.url)));
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
