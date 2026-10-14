/** CONTRATO PENDENTE: formato baseado no backend Whaticket/ZapPro; confirmar. */
export type UserProfile = "admin" | "supervisor" | "user";

export interface CompanyUser {
  id: number;
  name: string;
  email: string;
  profile: UserProfile;
  queueIds: number[];
  /** CONTRATO PENDENTE: bloqueio de acesso (backend deve impedir login e revogar sessões). */
  blocked?: boolean;
}

export interface CompanyUserInput {
  name: string;
  email: string;
  profile: UserProfile;
  queueIds: number[];
  blocked?: boolean;
  /** Obrigatória na criação; opcional na edição (vazia = manter). */
  password?: string;
}
