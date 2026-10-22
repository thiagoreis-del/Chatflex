export type UserProfile = "admin" | "supervisor" | "user";

export interface CompanyUser {
  id: number;
  name: string;
  email: string;
  profile: UserProfile;
  queueIds: number[];
  /** Cor escolhida no cadastro (chave da paleta); ausente = cor automática. CONTRATO PENDENTE no backend. */
  color?: string | null;
  /** CONTRATO PENDENTE: bloqueio de acesso (backend deve impedir login e revogar sessões). */
  blocked?: boolean;
}

export interface CompanyUserInput {
  name: string;
  email: string;
  profile: UserProfile;
  queueIds: number[];
  /** Cor opcional do atendente (chave da paleta). */
  color?: string | null;
  blocked?: boolean;
  /** Só superadmin: cria o usuário em outra empresa (backend valida `super`). */
  companyId?: number;
  /** Obrigatória na criação; opcional na edição (vazia = manter). */
  password?: string;
}
