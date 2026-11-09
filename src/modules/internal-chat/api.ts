import { queryOptions } from "@tanstack/react-query";
import { apiRequest, apiUpload } from "@/shared/api/client";
import { internalChatKeys } from "@/shared/api/query-keys";
import { internalChatEndpoints, withQuery } from "@/shared/config/endpoints";
import { normalizeUploadFile } from "@/shared/upload/pdf-file";
import { sessionStore } from "@/shared/auth/session-store";
import { conversationFromRecord, conversationPayload, messageFromRecord } from "./adapter";
import type { ChatRecord, ChatMessageRecord } from "./adapter";
import type { CreateConversationInput, InternalMessage } from "./types";

export { internalChatEndpoints } from "@/shared/config/endpoints";

function currentUserId() {
  const id = Number(sessionStore.get().user?.id);
  if (!Number.isInteger(id) || id <= 0) throw new Error("Authenticated session required");
  return id;
}

function adaptMessage(record: ChatMessageRecord) {
  return messageFromRecord(record, currentUserId(), Number(sessionStore.get().user?.companyId));
}

async function listConversations(signal?: AbortSignal) {
  const userId = currentUserId();
  const companyId = Number(sessionStore.get().user?.companyId);
  const records: ChatRecord[] = [];
  for (let pageNumber = 1; ; pageNumber++) {
    const res = await apiRequest<{ records: ChatRecord[]; hasMore?: boolean }>(
      withQuery(internalChatEndpoints.conversations, { pageNumber }),
      { signal },
    );
    const page = asArray<ChatRecord>(res);
    records.push(
      ...page.filter(
        (record) =>
          (record.companyId === undefined || record.companyId === companyId) &&
          (Number(record.ownerId) === userId ||
            record.users.some(
              (member) => Number(member.userId ?? member.user?.id) === userId,
            )),
      ),
    );
    if (!res.hasMore || !page.length) break;
  }
  return [
    ...new Map(
      records.map((record) => [record.id, conversationFromRecord(record, userId)]),
    ).values(),
  ];
}

const asArray = <T>(res: unknown): T[] => {
  if (Array.isArray(res)) return res as T[];
  const r = (res ?? {}) as { records?: T[]; data?: T[] };
  return r.records ?? r.data ?? [];
};

export const internalConversationsQuery = (companyId?: string) =>
  queryOptions({
    queryKey: internalChatKeys.conversations(companyId),
    queryFn: ({ signal }) => listConversations(signal),
    staleTime: 15_000,
  });

export const internalMessagesQuery = (conversationId: number) =>
  queryOptions({
    queryKey: internalChatKeys.messages(conversationId),
    queryFn: async ({ signal, client }) => {
      const cached = client.getQueryData<InternalMessage[]>(
        internalChatKeys.messages(conversationId),
      );
      if (cached?.length) {
        const recent = await fetchMessagePage(conversationId, 1, signal);
        return mergeInternalMessages(cached, recent.messages);
      }
      return fetchCompleteMessageHistory(conversationId, signal);
    },
  });

type MessagePage = { messages: InternalMessage[]; hasMore: boolean };

async function fetchMessagePage(
  conversationId: number,
  pageNumber: number,
  signal?: AbortSignal,
): Promise<MessagePage> {
  const res = await apiRequest<{
    records?: ChatMessageRecord[];
    data?: ChatMessageRecord[];
    hasMore?: boolean;
  }>(withQuery(internalChatEndpoints.messages(conversationId), { pageNumber }), { signal });
  return {
    messages: asArray<ChatMessageRecord>(res).map(adaptMessage),
    hasMore: Boolean(res.hasMore),
  };
}

async function fetchCompleteMessageHistory(conversationId: number, signal?: AbortSignal) {
  let merged: InternalMessage[] = [];
  for (let pageNumber = 1; ; pageNumber++) {
    const page = await fetchMessagePage(conversationId, pageNumber, signal);
    const before = merged.length;
    merged = mergeInternalMessages(merged, page.messages);
    if (!page.hasMore || !page.messages.length || merged.length === before) break;
  }
  return merged;
}

export function mergeInternalMessages(current: InternalMessage[], incoming: InternalMessage[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((left, right) => {
    const dateOrder = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    if (dateOrder) return dateOrder;
    return Number(left.id) - Number(right.id);
  });
}

export const createInternalConversation = async (input: CreateConversationInput) => {
  const userId = currentUserId();
  const record = await apiRequest<ChatRecord>(internalChatEndpoints.conversations, {
    method: "POST",
    body: conversationPayload(input, userId),
  });
  return conversationFromRecord(record, userId);
};

export const sendInternalMessage = async (conversationId: number, body: string) => {
  const record = await apiRequest<ChatMessageRecord>(
    internalChatEndpoints.messages(conversationId),
    {
      method: "POST",
      body: { message: body },
    },
  );
  return adaptMessage(record);
};

export const sendInternalMedia = async (conversationId: number, file: File, caption: string) => {
  const form = new FormData();
  form.append("file", await normalizeUploadFile(file));
  form.append("message", caption);
  const record = await apiUpload<ChatMessageRecord>(
    internalChatEndpoints.messages(conversationId),
    form,
  );
  return adaptMessage(record);
};

export const markInternalConversationRead = (conversationId: number) =>
  apiRequest<void>(internalChatEndpoints.read(conversationId), {
    method: "POST",
    body: {},
  });

export const deleteInternalConversation = (conversationId: number) =>
  apiRequest<void>(internalChatEndpoints.detail(conversationId), { method: "DELETE" });

async function updateMembers(conversationId: number, userId: number, add: boolean) {
  // Read the latest membership before a full-list update; never use stale dialog state.
  const conversation = (await listConversations()).find((record) => record.id === conversationId);
  if (!conversation || conversation.ownerId !== currentUserId())
    throw new Error("Chat owner required");
  const ids = new Set(conversation.participants.map((member) => member.id));
  if (add) ids.add(userId);
  else ids.delete(userId);
  ids.delete(conversation.ownerId);
  const record = await apiRequest<ChatRecord>(internalChatEndpoints.detail(conversationId), {
    method: "PUT",
    body: {
      title: conversation.kind === "direct" ? "" : conversation.title,
      users: [...ids].map((id) => ({ id })),
    },
  });
  return conversationFromRecord(record, currentUserId());
}

export const addInternalMember = (conversationId: number, userId: number) =>
  updateMembers(conversationId, userId, true);
export const removeInternalMember = (conversationId: number, userId: number) =>
  updateMembers(conversationId, userId, false);
