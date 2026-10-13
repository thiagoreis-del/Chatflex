/** CONTRATO PENDENTE: formato baseado no backend Whaticket/ZapPro (Baileys); confirmar. */
export type WhatsAppStatus =
  | "CONNECTED"
  | "DISCONNECTED"
  | "qrcode"
  | "OPENING"
  | "PAIRING"
  | "TIMEOUT";

export interface WhatsAppConnection {
  id: number;
  name: string;
  status: WhatsAppStatus;
  qrcode?: string | null;
  number?: string | null;
  isDefault: boolean;
  greetingMessage?: string | null;
  updatedAt?: string;
}

export interface WhatsAppInput {
  name: string;
  isDefault: boolean;
  greetingMessage: string;
}
