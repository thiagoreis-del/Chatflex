/** CONTRATO PENDENTE: formato baseado no backend Whaticket/ZapPro; confirmar. */
export interface Contact {
  id: number;
  name: string;
  number: string;
  email?: string | null;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactInput {
  name: string;
  number: string;
  email: string;
  tags: string[];
}
