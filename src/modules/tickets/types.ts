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
}

export interface TicketFilters {
  status: TicketStatus;
  search?: string;
}
