import type { ReactNode } from "react";
import type { UserRole } from "@/shared/auth/types";
import { usePermissions } from "./permissions";

/**
 * Mostra `children` apenas se o usuário tiver o perfil/permissão.
 * Apenas APRESENTAÇÃO: o backend precisa negar a ação de qualquer forma.
 */
export function PermissionGate({
  roles,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: {
  roles?: UserRole[];
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const p = usePermissions();
  const roleOk = !roles || p.hasRole(roles);
  const permOk =
    !permissions ||
    (requireAll ? permissions.every((x) => p.hasPermission(x)) : p.hasAnyPermission(permissions));
  return <>{roleOk && permOk ? children : fallback}</>;
}
