import { externalEndpoints } from "@/shared/config/endpoints";

export interface CnpjData {
  legalName: string;
  tradeName: string;
  email: string;
  phone: string;
  responsibleName: string;
}

interface BrasilApiCnpj {
  razao_social?: string;
  nome_fantasia?: string;
  email?: string | null;
  ddd_telefone_1?: string;
  qsa?: { nome_socio?: string }[];
}

export async function lookupCnpj(cnpj: string): Promise<CnpjData> {
  const res = await fetch(externalEndpoints.cnpj(cnpj));
  if (!res.ok) throw new Error(`cnpj ${res.status}`);
  const d = (await res.json()) as BrasilApiCnpj;
  return {
    legalName: d.razao_social ?? "",
    tradeName: d.nome_fantasia || d.razao_social || "",
    email: (d.email ?? "").toLowerCase(),
    phone: (d.ddd_telefone_1 ?? "").replace(/\D/g, ""),
    responsibleName: d.qsa?.[0]?.nome_socio ?? "",
  };
}
