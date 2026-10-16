export interface QuickMessage {
  id: number;
  shortcode: string;
  message: string;
  /** Visível para toda a empresa (true) ou apenas para quem criou (false). */
  geral: boolean;
}

export type QuickMessageInput = Omit<QuickMessage, "id">;
