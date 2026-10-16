import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useSession } from "@/shared/auth/session-store";
import { incomingTicketsQuery } from "@/modules/tickets/api";
import { computeSla, playSlaTone, slaConfigQuery, type SlaState } from "../sla";

const LEVELS: SlaState[] = ["warning", "urgent", "violated"];

/**
 * Alertas de SLA no painel (som, notificação do navegador, aviso visual).
 * Só roda quando a empresa ativou o SLA. Cada nível é avisado uma única vez por ciclo.
 */
export function SlaWatcher() {
  const { user } = useSession();
  const companyId = String(user?.companyId ?? "");
  const config = useQuery({ ...slaConfigQuery(companyId), enabled: !!user });
  const enabled = !!user && !!config.data?.enabled;
  const tickets = useQuery({ ...incomingTicketsQuery(companyId), enabled, refetchInterval: 30_000 });
  const { t } = useTranslation("settings");
  const notified = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled || !config.data) return;
    const c = config.data;
    const isSupervisor = user?.role !== "agent";
    const check = () => {
      for (const tk of tickets.data ?? []) {
        const info = computeSla(tk, c);
        if (!LEVELS.includes(info.state)) continue;
        // Atendente vê os seus; supervisores/admin veem violações se habilitado.
        const mine = !tk.user || String(tk.user.id) === String(user?.id);
        if (!mine && !(isSupervisor && c.supervisorAlerts && info.state === "violated")) continue;
        const key = `${tk.id}:${info.startedAt}:${info.state}`;
        if (notified.current.has(key)) continue;
        notified.current.add(key);
        const name = tk.contact?.name || `+${tk.contact?.number ?? ""}`;
        const text = t(`sla.alert.${info.state}`, { name });
        if (info.state === "violated") toast.error(text);
        else toast.warning(text);
        if (c.sound) playSlaTone(info.state === "warning" ? c.tone : "urgent", c.volume);
        if (c.desktop && typeof Notification !== "undefined" && Notification.permission === "granted") {
          // Sem o texto da mensagem do cliente (privacidade na tela de bloqueio).
          new Notification(t("sla.title"), { body: text, tag: key });
        }
      }
    };
    check();
    const id = setInterval(check, 10_000);
    return () => clearInterval(id);
  }, [enabled, config.data, tickets.data, user, t]);

  useEffect(() => {
    if (enabled && config.data?.desktop && typeof Notification !== "undefined" && Notification.permission === "default") {
      const ask = () => void Notification.requestPermission();
      window.addEventListener("pointerdown", ask, { once: true });
      return () => window.removeEventListener("pointerdown", ask);
    }
  }, [enabled, config.data?.desktop]);

  return null;
}
