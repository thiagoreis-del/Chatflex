/**
 * Tempo real do Atendimento via Socket.io (contrato ZapPro).
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

/** Intervalo de polling: só quando o Socket não está conectado. */
export function useFallbackInterval(ms = 5000): number | false {
  return useSocketStatus() === "connected" ? false : ms;
}

export function useTicketsRealtime(status: TicketStatus) {
  const qc = useQueryClient();
  useEffect(() => {
    const leaveTickets = socketClient.joinRoom("joinTickets", "leaveTickets", status);
    const leaveNotif = socketClient.joinRoom("joinNotification", "leaveNotification");
    const invalidate = () => void qc.invalidateQueries({ queryKey: [...ticketKeys.all, "list"] });
    const offTicket = socketClient.onCompany("ticket", invalidate);
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
