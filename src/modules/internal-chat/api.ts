import { queryOptions } from "@tanstack/react-query";
import { apiRequest, apiUpload } from "@/shared/api/client";
import { internalChatKeys } from "@/shared/api/query-keys";
import { withQuery } from "@/shared/config/endpoints";
import type {
  CreateConversationInput,
  InternalConversation,
  InternalMessage,
} from "./types";

/**
 * Chat interno por empresa.
 * CONTRATO PENDENTE: caminhos sugeridos; o backend deve isolar por empresa
 * (token da sessão) e nunca enviar estas mensagens ao WhatsApp do cliente.
 */
export const internalChatEndpoints = {
  conversations: "/internal-chat/conversations",
  messages: (id: number) => `/internal-chat/conversations/${id}/messages`,
  members: (id: number) => `/internal-chat/conversations/${id}/members`,
  member: (id: number, userId: number) => `/internal-chat/conversations/${id}/members/${userId}`,
} as const;

const asArray = <T,>(res: unknown): T[] => {
  if (Array.isArray(res)) return res as T[];
  const r = (res ?? {}) as { records?: T[]; data?: T[] };
  return r.records ?? r.data ?? [];
};

export const internalConversationsQuery = (companyId?: string) =>
  queryOptions({
    queryKey: internalChatKeys.conversations(companyId),
    queryFn: async ({ signal }) => {
      const res = await apiRequest<unknown>(internalChatEndpoints.conversations, { signal });
      return asArray<InternalConversation>(res);
    },
    staleTime: 15_000,
  });

export const internalMessagesQuery = (conversationId: number) =>
  queryOptions({
    queryKey: internalChatKeys.messages(conversationId),
    queryFn: async ({ signal }) => {
      const res = await apiRequest<unknown>(
        withQuery(internalChatEndpoints.messages(conversationId), { pageNumber: 1 }),
        { signal },
      );
      return asArray<InternalMessage>(res);
    },
  });

export const createInternalConversation = (body: CreateConversationInput) =>
  apiRequest<InternalConversation>(internalChatEndpoints.conversations, { method: "POST", body });

export const sendInternalMessage = (conversationId: number, body: string, ticketId?: number) =>
  apiRequest<InternalMessage>(internalChatEndpoints.messages(conversationId), {
    method: "POST",
    body: { body, ...(ticketId ? { ticketId } : {}) },
  });

export const sendInternalMedia = (conversationId: number, file: File, caption: string) => {
  const form = new FormData();
  form.append("medias", file);
  if (caption) form.append("body", caption);
  return apiUpload<InternalMessage>(internalChatEndpoints.messages(conversationId), form);
};

export const addInternalMember = (conversationId: number, userId: number) =>
  apiRequest<InternalConversation>(internalChatEndpoints.members(conversationId), {
    method: "POST",
    body: { userId },
  });

export const removeInternalMember = (conversationId: number, userId: number) =>
  apiRequest<void>(internalChatEndpoints.member(conversationId, userId), { method: "DELETE" });
