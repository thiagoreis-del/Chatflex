/**
 * Catálogo de permissões granulares (APRESENTAÇÃO). O backend sempre valida.
 * Se o backend enviar `user.permissions`, elas têm prioridade sobre o padrão do perfil.
 */
import type { AuthenticatedUser, UserRole } from "@/shared/auth/types";

export const PERMISSIONS = [
  "module.dashboard",
  "module.tickets",
  "module.connections",
  "module.status",
  "module.contacts",
  "module.quickMessages",
  "module.users",
  "module.queues",
  "module.settings",
  "tickets.transfer",
  "tickets.closeAll",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const AGENT: Permission[] = [
  "module.dashboard",
  "module.tickets",
  "module.status",
  "module.contacts",
  "module.quickMessages",
  "tickets.transfer",
];

export const ROLE_DEFAULTS: Record<UserRole, readonly Permission[]> = {
  superadmin: PERMISSIONS,
  company_admin: PERMISSIONS,
  agent: AGENT,
};

export function can(user: AuthenticatedUser | null, permission: Permission): boolean {
  if (!user) return false;
  if (user.role === "superadmin") return true;
  const granular = user.permissions.filter((p) => p.includes("."));
  if (granular.length > 0) return granular.includes(permission);
  return ROLE_DEFAULTS[user.role].includes(permission);
}
