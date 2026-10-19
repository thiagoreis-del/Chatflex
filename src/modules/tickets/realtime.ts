/**
 * Tempo real do Atendimento via Socket.io.
 * Payloads: appMessage `{ action, message, ticket? }`, ticket `{ action, ticket?, ticketId? }`.
 * Mensagens novas entram direto no cache; listas de tickets são invalidadas.
 */
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ticketKeys } from "@/shared/api/query-keys";
import { socketClient, useSocketStatus } from "@/shared/socket/socket-client";
import type { Message, TicketStatus } from "./types";

interface AppMessagePayload {
  action?: string;
  message?: Message & { ticketId?: number };
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
      void qc.invalidateQueries({ queryKey: [...ticketKeys.all, "list"] });
      void qc.invalidateQueries({ queryKey: [...ticketKeys.all, "incoming"] });
    };
    const offTicket = socketClient.onCompany("ticket", (raw) => {
      invalidate();
      const payload = raw as { ticketId?: number; ticket?: { id?: number } } | null;
      const ticketId = Number(payload?.ticketId ?? payload?.ticket?.id);
      if (Number.isFinite(ticketId) && ticketId > 0)
        void qc.invalidateQueries({ queryKey: ticketKeys.messages(ticketId) });
    });
    const offMsg = socketClient.onCompany("appMessage", invalidate);
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
      const p = raw as AppMessagePayload;
      const msg = p?.message;
      if (!msg || Number(msg.ticketId) !== ticketId) return;
      qc.setQueryData<Message[]>(ticketKeys.messages(ticketId), (prev = []) => {
        const i = prev.findIndex((m) => m.id === msg.id);
        if (i === -1) return p.action === "update" ? prev : [...prev, msg];
        const next = prev.slice();
        next[i] = { ...prev[i], ...msg };
        return next;
      });
    });
    return () => {
      leave();
      off();
    };
  }, [qc, ticketId]);
}
