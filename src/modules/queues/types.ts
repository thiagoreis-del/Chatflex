/** CONTRATO PENDENTE: formato baseado no backend Whaticket/ZapPro; confirmar. */
export interface Queue {
  id: number;
  name: string;
  color: string;
  greetingMessage?: string | null;
  ativarRoteador?: boolean | null;
  tempoRoteador?: number | null;
  orderQueue?: number | null;
  outOfHoursMessage?: string | null;
  schedules?: unknown[] | null;
  integrationId?: number | null;
  fileListId?: number | null;
  closeTicket?: boolean | null;
}

export interface QueueInput {
  name: string;
  color: string;
  greetingMessage: string;
}
