export interface Contact {
  id: number;
  name: string;
  number: string;
  /** Foto já disponibilizada pelo WhatsApp através do backend. */
  profilePicUrl?: string | null;
  email?: string | null;
  tags?: string[];
  extraInfo?: Array<{ id?: number; name: string; value: string }>;
  whatsapp?: { id: number; name: string } | null;
  /** Contato é um grupo do WhatsApp: número é opcional (JID interno). */
  isGroup?: boolean | undefined;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactInput {
  name: string;
  number: string;
  email: string;
  tags: string[];
}
