import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { evaluateRouteAccess } from "./lib/auth/rbac";
import { isSystemRoute, findRouteRule } from "./lib/auth/route-registry";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass Next.js system internals and static assets
  if (isSystemRoute(pathname)) {
    return NextResponse.next();
  }

  // 2. Extract authentication cookie or header (if present)
  const token =
    request.cookies.get("access_token")?.value ||
    request.cookies.get("token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  const role =
    request.cookies.get("user_role")?.value ||
    request.headers.get("x-user-role");

  // 3. Find route rule in registry
  const rule = findRouteRule(pathname);

  // 4. If undeclared route, fail closed (Default = Deny)
  if (!rule) {
    console.warn(`[ZeroTrust:Middleware] Blocked unregistered route: ${pathname}`);
    const unauthorizedUrl = new URL("/unauthorized", request.url);
    unauthorizedUrl.searchParams.set("reason", "UNDECLARED_ROUTE");
    return NextResponse.redirect(unauthorizedUrl);
  }

  // 5. If route is public, allow access immediately
  if (rule.sensitivity === "PUBLIC") {
    return NextResponse.next();
  }

  // 6. If protected route and user is unauthenticated, redirect to landing login
  if (!token && !role) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 7. Evaluate role and permission authorization
  const authResult = evaluateRouteAccess(pathname, role);

  if (!authResult.allowed) {
    console.warn(`[ZeroTrust:Middleware] 403 Forbidden: User with role '${role}' attempted to access '${pathname}'. Reason: ${authResult.reason}`);
    const unauthorizedUrl = new URL("/unauthorized", request.url);
    unauthorizedUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(unauthorizedUrl);
  }

  return NextResponse.next();
}

// Apply middleware to all routes except api, _next static files, and favicon
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
