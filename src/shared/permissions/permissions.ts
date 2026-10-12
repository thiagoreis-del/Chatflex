/**
 * ATENÇÃO: estes controles apenas MELHORAM A INTERFACE (ocultar/mostrar).
 * Eles NÃO substituem a autorização do backend, que valida cada requisição.
 */
import { useSession } from "@/shared/auth/session-store";
import type { AuthenticatedUser, UserRole } from "@/shared/auth/types";

export function hasRole(user: AuthenticatedUser | null, roles: UserRole | UserRole[]) {
  if (!user) return false;
  const list = Array.isArray(roles) ? roles : [roles];
  return list.includes(user.role);
}

export function hasPermission(user: AuthenticatedUser | null, permission: string) {
  return !!user && user.permissions.includes(permission);
}

export function hasAnyPermission(user: AuthenticatedUser | null, permissions: string[]) {
  return !!user && permissions.some((p) => user.permissions.includes(p));
}

export function usePermissions() {
  const { user } = useSession();
  return {
    user,
    hasRole: (roles: UserRole | UserRole[]) => hasRole(user, roles),
    hasPermission: (p: string) => hasPermission(user, p),
    hasAnyPermission: (ps: string[]) => hasAnyPermission(user, ps),
  };
}
