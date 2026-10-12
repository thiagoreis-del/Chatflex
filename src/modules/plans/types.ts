export interface PlanFeatures {
  campaigns: boolean;
  internalChat: boolean;
  integrations: boolean;
  artificialIntelligence: boolean;
  advancedReports: boolean;
  externalApi: boolean;
  automations: boolean;
}

export const planFeatureKeys: (keyof PlanFeatures)[] = [
  "campaigns",
  "internalChat",
  "integrations",
  "artificialIntelligence",
  "advancedReports",
  "externalApi",
  "automations",
];

/**
 * Preços em CENTAVOS inteiros (CONTRATO PENDENTE: confirmar unidade com o backend).
 * O backend é a autoridade de preço.
 */
export interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number | null;
  userLimit: number;
  connectionLimit: number;
  storageLimitMb: number;
  trialDays: number;
  features: PlanFeatures;
  active: boolean;
}

export type PlanInput = Omit<Plan, "id">;
