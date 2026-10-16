export type InternalConversationKind = "direct" | "group" | "queue";

export interface InternalConversation {
  id: number;
  kind: InternalConversationKind;
  /** Nome do grupo/fila ou do outro participante na conversa direta. */
  title: string;
  queueId?: number | null;
  lastMessage?: string;
  updatedAt: string;
  unreadMessages: number;
  participants: { id: number; name: string }[];
}

export interface InternalMessage {
  id: string;
  conversationId: number;
  body: string;
  fromMe: boolean;
  createdAt: string;
  sender?: { id: number; name: string } | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  /** Ticket vinculado (nota interna de atendimento), quando houver. */
  ticketId?: number | null;
}

export interface CreateConversationInput {
  kind: InternalConversationKind;
  userIds: number[];
  name?: string;
  queueId?: number;
}
