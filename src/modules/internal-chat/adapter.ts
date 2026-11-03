import type { CreateConversationInput, InternalConversation, InternalMessage } from "./types";

export interface ChatParticipantRecord {
  userId: number;
  unreads?: number;
  user?: { id: number; name: string };
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
  mediaName?: string | null;
}

export function conversationFromRecord(record: ChatRecord, userId: number): InternalConversation {
  const participants = record.users.flatMap((member) => member.user ? [member.user] : []);
  const other = participants.find((member) => member.id !== userId);
  return {
    id: record.id,
    ownerId: record.ownerId,
    kind: record.title ? "group" : "direct",
    title: record.title || other?.name || participants.map((member) => member.name).join(", "),
    lastMessage: record.lastMessage,
    updatedAt: record.updatedAt,
    unreadMessages: record.users.find((member) => member.userId === userId)?.unreads ?? 0,
    participants,
  };
}

export function messageFromRecord(record: ChatMessageRecord, userId: number): InternalMessage {
  return {
    id: String(record.id),
    conversationId: record.chatId,
    body: record.message || "",
    fromMe: record.senderId === userId,
    createdAt: record.createdAt,
    sender: record.sender,
    mediaUrl: record.mediaUrl,
    mediaName: record.mediaName,
  };
}

export function conversationPayload(input: CreateConversationInput, userId: number) {
  if (input.kind === "queue") throw new Error("Queue chat contract is not supported");
  const ids = [...new Set(input.userIds)].filter((id) => id !== userId && Number.isInteger(id) && id > 0);
  if (!ids.length || (input.kind === "direct" && ids.length !== 1)) throw new Error("Invalid participants");
  if (input.kind === "group" && !input.name?.trim()) throw new Error("Missing group title");
  return { title: input.kind === "group" ? input.name?.trim() : "", users: ids.map((id) => ({ id })) };
}