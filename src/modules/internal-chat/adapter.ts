import type { CreateConversationInput, InternalConversation, InternalMessage } from "./types";
import { internalChatEndpoints } from "@/shared/config/endpoints";
import { env } from "@/shared/config/env";
import { stripQuote } from "./quote";

export interface ChatParticipantRecord {
  userId?: number | string;
  unreads?: number | string;
  user?: { id: number | string; name: string };
}

export interface ChatRecord {
  id: number;
  companyId?: number;
  ownerId: number;
  title: string;
  lastMessage?: string;
  updatedAt: string;
  users: ChatParticipantRecord[];
}

export interface ChatMessageRecord {
  id: number;
  chatId: number;
  senderId: number;
  message: string;
  createdAt: string;
  sender?: { id: number; name: string };
  mediaUrl?: string | null;
  mediaPath?: string | null;
  mediaName?: string | null;
}

export function conversationFromRecord(record: ChatRecord, userId: number): InternalConversation {
  const participantId = (member: ChatParticipantRecord) => Number(member.userId ?? member.user?.id);
  const participants = record.users.flatMap((member) =>
    member.user && Number.isInteger(Number(member.user.id))
      ? [{ id: Number(member.user.id), name: member.user.name }]
      : [],
  );
  const other = participants.find((member) => member.id !== userId);
  return {
    id: record.id,
    ownerId: record.ownerId,
    kind: record.title ? "group" : "direct",
    title: record.title || other?.name || participants.map((member) => member.name).join(", "),
    // Prévia nunca mostra o marcador de citação de uma resposta.
    ...(record.lastMessage !== undefined ? { lastMessage: stripQuote(record.lastMessage) } : {}),
    updatedAt: record.updatedAt,
    unreadMessages: Math.max(
      0,
      Number(record.users.find((member) => participantId(member) === userId)?.unreads ?? 0) || 0,
    ),
    participants,
  };
}

export function messageFromRecord(
  record: ChatMessageRecord,
  userId: number,
  companyId?: number,
): InternalMessage {
  // The verified controller stores only file.filename, in the authenticated company's folder.
  const filename = record.mediaPath;
  const scopedUrl =
    companyId &&
    Number.isInteger(companyId) &&
    companyId > 0 &&
    filename &&
    !/[\\/]/.test(filename) &&
    !filename.includes(String.fromCharCode(0)) &&
    filename !== "." &&
    filename !== ".."
      ? `${env.apiUrl}${internalChatEndpoints.media(companyId, filename)}`
      : null;
  const mediaUrl = record.mediaUrl || scopedUrl;
  const extension = (record.mediaName || filename || mediaUrl || "")
    .split("?")[0]
    ?.split(".")
    .pop()
    ?.toLowerCase();
  const mediaType =
    extension && ["ogg", "opus", "webm", "mp3", "m4a", "wav", "aac"].includes(extension)
      ? "audio"
      : extension && ["png", "jpg", "jpeg", "gif", "webp"].includes(extension)
        ? "image"
        : extension && ["mp4", "mov"].includes(extension)
          ? "video"
          : "document";
  return {
    id: String(record.id),
    conversationId: record.chatId,
    body: record.message || "",
    fromMe: record.senderId === userId,
    createdAt: record.createdAt,
    sender: record.sender ?? null,
    mediaUrl,
    mediaType: mediaUrl ? mediaType : null,
    mediaName: record.mediaName ?? null,
  };
}

export function conversationPayload(input: CreateConversationInput, userId: number) {
  if (input.kind === "queue") throw new Error("Queue chat contract is not supported");
  const ids = [...new Set(input.userIds)].filter(
    (id) => id !== userId && Number.isInteger(id) && id > 0,
  );
  if (!ids.length || (input.kind === "direct" && ids.length !== 1))
    throw new Error("Invalid participants");
  if (input.kind === "group" && !input.name?.trim()) throw new Error("Missing group title");
  return {
    title: input.kind === "group" ? input.name?.trim() : "",
    users: ids.map((id) => ({ id })),
  };
}
