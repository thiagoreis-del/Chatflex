/** CONTRATO PENDENTE: formato baseado no backend Whaticket/ZapPro; confirmar. */
export type UserProfile = "admin" | "user";

export interface CompanyUser {
  id: number;
  name: string;
  email: string;
  profile: UserProfile;
  queueIds: number[];
}

export interface CompanyUserInput {
  name: string;
  email: string;
  profile: UserProfile;
  queueIds: number[];
  /** Obrigatória na criação; opcional na edição (vazia = manter). */
  password?: string;
}
