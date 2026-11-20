/**
 * Tempo real do Atendimento via Socket.io.
 * Payloads: appMessage `{ action, message, ticket? }`, ticket `{ action, ticket?, ticketId? }`.
 * Mensagens novas entram direto no cache; listas de tickets são invalidadas.
 */
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sessionCacheScope, ticketKeys } from "@/shared/api/query-keys";
import { socketClient, useSocketStatus } from "@/shared/socket/socket-client";
import type { TicketStatus } from "./types";

interface AppMessagePayload {
  ticketId?: unknown;
  ticket?: { id?: unknown };
  message?: { ticketId?: unknown; ticket?: { id?: unknown } };
}

function eventTicketId(raw: unknown): number | undefined {
  if (!raw || typeof raw !== "object") return;
  const payload = raw as AppMessagePayload;
  const value =
    payload.message?.ticketId ??
    payload.message?.ticket?.id ??
    payload.ticketId ??
    payload.ticket?.id;
  if (typeof value !== "number" && typeof value !== "string") return;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

/**
 * Socket conectado não garante entrega dos eventos de todas as salas.
 * Mantém a consulta de segurança rápida mesmo quando o transporte está conectado.
 */
export function useFallbackInterval(ms = 3000): number {
  return ms;
}

export function useTicketsRealtime(status: TicketStatus) {
  const qc = useQueryClient();
  const socketStatus = useSocketStatus();
  // Ao (re)conectar, recarrega tudo para recuperar eventos perdidos enquanto offline.
  useEffect(() => {
    if (socketStatus === "connected") void qc.invalidateQueries({ queryKey: ticketKeys.all });
  }, [qc, socketStatus]);
  useEffect(() => {
    const refresh = () => void qc.invalidateQueries({ queryKey: ticketKeys.all });
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [qc]);
  useEffect(() => {
    const leaveTickets = socketClient.joinRoom("joinTickets", "leaveTickets", status);
    const leaveNotif = socketClient.joinRoom("joinNotification", "leaveNotification");
    const invalidate = () => {
      void qc.invalidateQueries({ queryKey: [...ticketKeys.all, ...sessionCacheScope(), "list"] });
      void qc.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === ticketKeys.all[0] &&
          query.queryKey[1] === ticketKeys.all[1] &&
          (query.queryKey.includes("incoming") || query.queryKey.includes("sla-active")),
      });
    };
    const offTicket = socketClient.onCompany("ticket", (raw) => {
      invalidate();
      const payload = raw as { ticketId?: number; ticket?: { id?: number } } | null;
      const ticketId = Number(payload?.ticketId ?? payload?.ticket?.id);
      if (Number.isFinite(ticketId) && ticketId > 0)
        void qc.invalidateQueries({ queryKey: ticketKeys.messages(ticketId) });
    });
    const offMsg = socketClient.onCompany("appMessage", (raw) => {
      invalidate();
      const ticketId = eventTicketId(raw);
      if (ticketId !== undefined)
        void qc.invalidateQueries(
          { queryKey: ticketKeys.messages(ticketId) },
          { cancelRefetch: false },
        );
    });
    const offContact = socketClient.onCompany("contact", invalidate);
    return () => {
      leaveTickets();
      leaveNotif();
      offTicket();
      offMsg();
      offContact();
    };
  }, [qc, status]);
}

export function useMessagesRealtime(ticketId: number) {
  const qc = useQueryClient();
  useEffect(() => {
    const leave = socketClient.joinRoom("joinChatBox", "joinChatBoxLeave", String(ticketId));
    const off = socketClient.onCompany("appMessage", (raw) => {
      if (eventTicketId(raw) !== ticketId) return;
      // Events may contain only receipts/metadata. Read the authorized canonical
      // page instead of treating a partial payload as a complete message.
      // Both listeners share this query; do not cancel/restart an in-flight read.
      void qc.invalidateQueries(
        { queryKey: ticketKeys.messages(ticketId) },
        { cancelRefetch: false },
      );
    });
    return () => {
      leave();
      off();
    };
  }, [qc, ticketId]);
}
