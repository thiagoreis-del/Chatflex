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
}

export interface TicketFilters {
  status: TicketStatus;
  search?: string;
}
