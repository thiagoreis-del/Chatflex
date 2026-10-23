export interface Contact {
  id: number;
  name: string;
  number: string;
  email?: string | null;
  tags?: string[];
  /** Contato é um grupo do WhatsApp: número é opcional (JID interno). */
  isGroup?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactInput {
  name: string;
  number: string;
  email: string;
  tags: string[];
}
