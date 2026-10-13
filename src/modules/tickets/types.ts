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
  updatedAt: string;
  unreadMessages: number;
  contact: TicketContact;
  queue: { id: number; name: string; color: string } | null;
  user: { id: number; name: string } | null;
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
