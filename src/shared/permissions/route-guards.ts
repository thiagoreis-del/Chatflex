import { redirect } from "@tanstack/react-router";
import { sessionStore } from "@/shared/auth/session-store";
import type { UserRole } from "@/shared/auth/types";
import { hasRole } from "./permissions";

/**
 * Proteção de rota por perfil (apresentação). Use em `beforeLoad` de rotas sob /app.
 * O backend continua decidindo o acesso aos dados.
 */
export function requireRole(roles: UserRole[]) {
  if (!hasRole(sessionStore.get().user, roles)) {
    throw redirect({ to: "/403" });
  }
}
