export interface QuickMessage {
  id: number;
  shortcode: string;
  message: string;
  /** Visível para toda a empresa (true) ou apenas para quem criou (false). */
  geral: boolean;
  /** Empresa dona da resposta; pode vir ausente conforme o backend. */
  companyId?: number | string;
}

export type QuickMessageInput = Omit<QuickMessage, "id">;
