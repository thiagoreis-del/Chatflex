import type { AuthenticatedUser, UserRole } from "./types";

/**
 * Converte o usuário do backend (formato ZapPro/Whaticket: `profile`, `super`,
 * ids numéricos) para o formato interno. Apenas apresentação; o backend autoriza.
 */
export function normalizeUser(raw: unknown): AuthenticatedUser {
  const u = (raw ?? {}) as {
    id?: unknown;
    name?: unknown;
    email?: unknown;
    role?: unknown;
    super?: unknown;
    profile?: unknown;
    companyId?: unknown;
    permissions?: unknown;
    queues?: { id?: unknown }[] | null;
    company?: { dueDate?: string | null; status?: boolean | null; name?: string | null } | null;
    impersonated?: unknown;
  };
  let role: UserRole;
  if (u.role === "superadmin" || u.role === "company_admin" || u.role === "agent") {
    role = u.role;
  } else if (u.super === true) {
    role = "superadmin";
  } else if (u.profile === "admin") {
    role = "company_admin";
  } else {
    role = "agent";
  }
  return {
    id: String(u.id ?? ""),
    name: String(u.name ?? ""),
    email: String(u.email ?? ""),
    role,
    companyId: String(u.companyId ?? ""),
    permissions: Array.isArray(u.permissions) ? (u.permissions as string[]) : [],
    companyDueDate: u.company?.dueDate ?? null,
    companyActive: u.company?.status !== false,
    queueIds: Array.isArray(u.queues)
      ? u.queues.map((q) => Number(q?.id)).filter((n) => Number.isFinite(n))
      : [],
    impersonated: u.impersonated === true,
    ...(u.company?.name ? { companyName: String(u.company.name) } : {}),
  };
}
