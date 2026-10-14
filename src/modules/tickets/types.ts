export type TicketStatus = "pending" | "open" | "closed";

export interface TicketContact {
  id: number;
  name: string;
  number: string;
}

export interface Ticket {
  id: number;
  status: TicketStatus;
  lastMessage: string;
  createdAt?: string;
  /** Preenchido pelo backend quando a primeira resposta humana é registrada. */
  firstResponseAt?: string | null;
  updatedAt: string;
  unreadMessages: number;
  contact: TicketContact;
  queue: { id: number; name: string; color: string } | null;
  user: { id: number; name: string } | null;
  /** Conexão que recebeu a conversa. O backend pode expor como `whatsapp`. */
  whatsapp?: { id: number; name: string; number?: string | null } | null;
  tags?: TicketTag[];
}

export interface TicketTag {
  id: number;
  name: string;
  color: string;
}

export interface Message {
  id: string;
  ticketId: number;
  body: string;
  fromMe: boolean;
  createdAt: string;
  /** URL absoluta do arquivo (backend monta `/public/company{id}/arquivo`). */
  mediaUrl?: string | null;
  /** Ex.: "image", "video", "audio", "application", "document". */
  mediaType?: string | null;
  /** Nota interna: visível só para a equipe, não é enviada ao cliente. */
  isPrivate?: boolean;
  /** Backend inclui o ticket com o atendente responsável (`ticket.user`). */
  ticket?: { user?: { id: number; name: string } | null } | null;
}

export interface TicketFilters {
  status: TicketStatus;
  search?: string;
}

export interface TransferInput {
  queueId: number;
  userId?: number | null;
  note?: string;
}
