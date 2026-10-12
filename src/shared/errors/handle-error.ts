import { toast } from "sonner";
import { i18n } from "@/shared/i18n";
import { isApiError } from "@/shared/api/errors";

/**
 * Tratamento central de erros (401, 403, 404, 409, 422, 429, 5xx, rede).
 * 401 é resolvido no cliente HTTP (refresh + logout). Aqui só notificamos.
 */
export function notifyError(error: unknown) {
  if (isApiError(error)) {
    if (error.kind === "aborted" || error.kind === "unauthorized") return;
    toast.error(i18n.t(error.messageKey, { ns: "errors" }));
    return;
  }
  toast.error(i18n.t("api.unknown", { ns: "errors" }));
}

/** Não repetir erros de cliente (4xx); repetir no máximo 2x falhas de rede/servidor. */
export function shouldRetry(failureCount: number, error: unknown) {
  if (isApiError(error) && (error.kind === "network" || error.kind === "server")) {
    return failureCount < 2;
  }
  return false;
}

/** Chave de tradução para exibir um erro de API em formulários. */
export function errorMessageKey(error: unknown): string {
  return isApiError(error) ? `errors:${error.messageKey}` : "errors:api.unknown";
}
