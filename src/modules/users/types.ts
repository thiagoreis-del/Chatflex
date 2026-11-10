export type UserProfile = "admin" | "supervisor" | "user";

export interface CompanyUser {
  id: number;
  name: string;
  email: string;
  profile: UserProfile;
  queueIds: number[];
  /** Cor escolhida no cadastro (chave da paleta); ausente = cor automática. CONTRATO PENDENTE no backend. */
  color?: string | null | undefined;
  /** CONTRATO PENDENTE: bloqueio de acesso (backend deve impedir login e revogar sessões). */
  blocked?: boolean;
  /** Backend Whaticket: "enable" permite ver conversas sem fila e grupos. */
  allTicket?: "enable" | "disable";
}

export interface CompanyUserInput {
  name: string;
  email: string;
  profile: UserProfile;
  queueIds: number[];
  /** Cor opcional do atendente (chave da paleta). */
  color?: string | null | undefined;
  blocked?: boolean;
  allTicket?: "enable" | "disable";
  /** Só superadmin: cria o usuário em outra empresa (backend valida `super`). */
  companyId?: number;
  /** Obrigatória na criação; opcional na edição (vazia = manter). */
  password?: string;
}
