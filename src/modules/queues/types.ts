/** CONTRATO PENDENTE: formato baseado no backend Whaticket/ZapPro; confirmar. */
export interface Queue {
  id: number;
  name: string;
  color: string;
  greetingMessage?: string | null;
}

export interface QueueInput {
  name: string;
  color: string;
  greetingMessage: string;
}
