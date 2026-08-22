/**
 * Pure RBAC & Route Authorization Engine for ExamForge.
 * Evaluates route permissions, role capabilities, and default-deny policies.
 */

import { findRouteRule, isSystemRoute, RouteRule } from "./route-registry";
import { getRolePermissions } from "./permissions";
import { CanonicalRole } from "./roles";

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  matchedRule?: RouteRule;
  requiredPermissions?: string[];
}

/**
 * Evaluates whether a given role and permission set can access the specified pathname.
 * Enforces DEFAULT = DENY for any unregistered route.
 */
export function evaluateRouteAccess(
  pathname: string,
  userRole?: string | null,
  userPermissions?: string[] | null
): AuthorizationResult {
  // 1. System routes (static assets, next chunks) are always permitted
  if (isSystemRoute(pathname)) {
    return { allowed: true, reason: "SYSTEM_ROUTE" };
  }

  // 2. Find matching route rule in the central registry
  const rule = findRouteRule(pathname);

  // 3. DEFAULT = DENY for unknown / undeclared routes
  if (!rule) {
    return {
      allowed: false,
      reason: `UNDECLARED_ROUTE_DENIED: Route '${pathname}' is not registered in the central authorization registry.`,
    };
  }

  // 4. PUBLIC routes are accessible by everyone (authenticated or unauthenticated)
  if (rule.sensitivity === "PUBLIC") {
    return { allowed: true, matchedRule: rule, reason: "PUBLIC_ROUTE" };
  }

  // 5. Protected route without authenticated role -> DENY
  if (!userRole) {
    return {
      allowed: false,
      matchedRule: rule,
      requiredPermissions: rule.requiredPermissions,
      reason: "UNAUTHENTICATED",
    };
  }

  const normalizedRole = userRole.toUpperCase();

  // 6. SUPER_ADMIN receives all platform permissions
  if (normalizedRole === CanonicalRole.SUPER_ADMIN || normalizedRole === "PLATFORM_SUPER_ADMIN") {
    return { allowed: true, matchedRule: rule, reason: "SUPER_ADMIN_PERMISSION_SET" };
  }

  // 7. Resolve user permissions (from explicit list or canonical role mapping)
  const rolePerms = getRolePermissions(normalizedRole);
  const effectivePerms = new Set([
    ...Array.from(rolePerms),
    ...(userPermissions || []),
  ]);

  // 8. If route requires no specific permissions (just authenticated access), permit
  if (rule.requiredPermissions.length === 0) {
    return { allowed: true, matchedRule: rule, reason: "AUTHENTICATED_ACCESS" };
  }

  // 9. Check if user holds at least one of the permitted permissions for this route
  const hasRequiredPermission = rule.requiredPermissions.some((reqPerm) => effectivePerms.has(reqPerm));

  if (hasRequiredPermission) {
    return { allowed: true, matchedRule: rule, reason: "PERMISSION_GRANTED" };
  }

  return {
    allowed: false,
    matchedRule: rule,
    requiredPermissions: rule.requiredPermissions,
    reason: `FORBIDDEN: Role '${userRole}' lacks required permissions: [${rule.requiredPermissions.join(", ")}]`,
  };
}

/**
 * Convenience helper returning boolean allowed status.
 */
export function canAccessRoute(
  pathname: string,
  userRole?: string | null,
  userPermissions?: string[] | null
): boolean {
  return evaluateRouteAccess(pathname, userRole, userPermissions).allowed;
}
