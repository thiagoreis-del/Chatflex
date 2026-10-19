import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useSession } from "@/shared/auth/session-store";
import { computeSla, slaConfigQuery } from "@/modules/sla/sla";
import { incomingTicketsQuery } from "../api";

/**
 * Avisos para administradores da empresa: novas conversas aguardando e SLAs
 * próximos do vencimento. Tudo é isolado pela empresa da sessão (companyId),
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
  const sla = useQuery(slaConfigQuery(companyId));
  // Dedup por empresa: chaves incluem companyId para nunca misturar avisos.
  const seenConversations = useRef(new Set<string>());
  const seenSla = useRef(new Map<string, string>());
  const firstRun = useRef(true);

  useEffect(() => {
    if (!tickets.data) return;
    const config = sla.data;
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

    // SLAs próximos do vencimento (avisos ao entrar em atenção/urgência).
    if (config?.enabled) {
      const now = Date.now();
      for (const ticket of tickets.data) {
        const info = computeSla(ticket, config, now);
        const key = `${companyId}:${ticket.id}`;
        const previous = seenSla.current.get(key);
        if (info.state === "none" || info.state === "monitoring") {
          seenSla.current.delete(key);
          continue;
        }
        if (firstRun.current || previous === info.state) {
          seenSla.current.set(key, info.state);
          continue;
        }
        seenSla.current.set(key, info.state);
        const contact = ticket.contact?.name || t("notifications.customer");
        const label =
          info.state === "violated"
            ? t("adminAlerts.slaViolated")
            : info.state === "urgent"
              ? t("adminAlerts.slaUrgent")
              : t("adminAlerts.slaWarning");
        toast.error(label, {
          description: t("adminAlerts.slaBody", { contact }),
          action: { label: t("notifications.view"), onClick: go },
        });
      }
    }

    firstRun.current = false;
  }, [tickets.data, sla.data, companyId, navigate, t]);

  return null;
}
