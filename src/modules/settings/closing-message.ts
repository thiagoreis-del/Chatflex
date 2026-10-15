import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { settingEndpoints as ep } from "@/shared/config/endpoints";

/**
 * Mensagem de agradecimento ao finalizar, uma por empresa (a empresa vem do token).
 * CONTRATO PENDENTE: usa a chave `closingMessage` em /settings (padrão Whaticket); confirmar na VPS.
 */
export interface ClosingMessageSetting {
  enabled: boolean;
  message: string;
}

const KEY = "closingMessage";

function parse(raw: unknown): ClosingMessageSetting | null {
  const value = (raw as { value?: unknown } | null)?.value ?? raw;
  if (typeof value !== "string" || !value) return null;
  try {
    const v = JSON.parse(value) as Partial<ClosingMessageSetting>;
    return { enabled: Boolean(v.enabled), message: String(v.message ?? "") };
  } catch {
    return { enabled: true, message: value };
  }
}

export const closingMessageQuery = (companyId: string) =>
  queryOptions({
    queryKey: ["settings", companyId, KEY],
    queryFn: async ({ signal }) => {
      try {
        return parse(await apiRequest<unknown>(ep.detail(KEY), { signal }));
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60_000,
  });

export const saveClosingMessage = (s: ClosingMessageSetting) =>
  apiRequest<unknown>(ep.detail(KEY), { method: "PUT", body: { value: JSON.stringify(s) } });
