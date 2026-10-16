import type { Plan } from "./types";

/** Limites "ilimitados" enviados ao backend (que exige número) nos planos por conexão. */
export const UNLIMITED = 9999;

export interface PublicPlan {
  id: string;
  name: string;
  connections: number;
  monthlyPrice: number; // centavos
  recommended: boolean;
}

/** Planos padrão da regra comercial: limite apenas por conexões WhatsApp. */
export const defaultPublicPlans: PublicPlan[] = [
  { id: "1", name: "Plano 1 WhatsApp", connections: 1, monthlyPrice: 9990, recommended: false },
  { id: "2", name: "Plano 2 WhatsApps", connections: 2, monthlyPrice: 15000, recommended: true },
  { id: "3", name: "Plano 3 WhatsApps", connections: 3, monthlyPrice: 20000, recommended: false },
];

/** Planos visíveis na landing: só ativos/públicos com preço; ordenados por conexões. O de 2 conexões é o "Mais escolhido". */
export function toPublicPlans(plans: Plan[]): PublicPlan[] {
  const list = plans
    .filter((p) => p.active && p.monthlyPrice > 0 && p.connectionLimit > 0)
    .sort((a, b) => a.connectionLimit - b.connectionLimit || a.monthlyPrice - b.monthlyPrice)
    .map((p) => ({
      id: p.id,
      name: p.name,
      connections: p.connectionLimit,
      monthlyPrice: p.monthlyPrice,
      recommended: p.connectionLimit === 2,
    }));
  return list.length ? list : defaultPublicPlans;
}

/** Downgrade só é permitido se a empresa já cabe no novo limite. */
export function canChangeToPlan(currentConnections: number, newLimit: number): boolean {
  return currentConnections <= newLimit;
}

/** Pode adicionar mais uma conexão sem ultrapassar o contratado. */
export function canAddConnection(currentConnections: number, limit: number): boolean {
  return limit <= 0 || currentConnections < limit;
}
