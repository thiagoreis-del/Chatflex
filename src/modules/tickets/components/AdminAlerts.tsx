import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useSession } from "@/shared/auth/session-store";
import { incomingTicketsQuery } from "../api";

/**
 * Avisos para administradores da empresa sobre novas conversas aguardando.
 * O SlaWatcher é a única fonte de alertas de SLA, evitando consultas e avisos
 * duplicados. Tudo é isolado pela empresa da sessão (companyId),
 * então um superadmin dentro de uma empresa só vê os dados dela.
 */
export function AdminAlerts() {
  const { user } = useSession();
  const isAdmin = user?.role === "superadmin" || user?.role === "company_admin";
  return user && isAdmin ? (
    <CompanyAdminAlerts key={user.companyId} companyId={user.companyId} />
  ) : null;
}

function CompanyAdminAlerts({ companyId }: { companyId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tickets = useQuery({ ...incomingTicketsQuery(companyId), refetchInterval: 30_000 });
  // Dedup por empresa: chaves incluem companyId para nunca misturar avisos.
  const seenConversations = useRef(new Set<string>());
  const firstRun = useRef(true);

  useEffect(() => {
    if (!tickets.data) return;
    const go = () => void navigate({ to: "/app/atendimento" });

    // Novas conversas aguardando atendimento.
    const pending = tickets.data.filter((ticket) => ticket.status === "pending");
    const fresh = pending.filter(
      (ticket) => !seenConversations.current.has(`${companyId}:${ticket.id}`),
    );
    for (const ticket of pending) seenConversations.current.add(`${companyId}:${ticket.id}`);
    // Na primeira carga só registra o estado atual, sem disparar avisos retroativos.
    if (!firstRun.current && fresh.length > 0) {
      const names = fresh
        .slice(0, 3)
        .map((ticket) => ticket.contact?.name || t("notifications.customer"))
        .join(", ");
      toast.warning(t("adminAlerts.newConversationTitle"), {
        description: t("adminAlerts.newConversationBody", { count: fresh.length, names }),
        action: { label: t("notifications.view"), onClick: go },
      });
    }

    firstRun.current = false;
  }, [tickets.data, companyId, navigate, t]);

  return null;
}
