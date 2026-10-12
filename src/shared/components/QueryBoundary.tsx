import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Clock, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isApiError } from "@/shared/api/errors";
import { AccessDenied, BackendUnavailable, ErrorState, LoadingState } from "./states";

/** Contrato pendente: mostrado quando o endpoint ainda não existe no backend. */
export function DataUnavailable({ contract, compact = false }: { contract?: string | undefined; compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className={compact ? "space-y-1" : "flex flex-col items-center gap-2 p-8 text-center"}>
      {!compact && <FileQuestion className="size-6 text-muted-foreground" aria-hidden />}
      <p className="font-medium text-muted-foreground">{t("states.dataUnavailable")}</p>
      {contract && (
        <p className="text-xs text-muted-foreground">
          {t("states.pendingContractLabel")} <code className="rounded bg-muted px-1 py-0.5">{contract}</code>
        </p>
      )}
    </div>
  );
}

/**
 * Renderiza o estado de erro adequado para uma consulta:
 * 403 → acesso negado; rede/5xx → backend indisponível; 404 → contrato pendente;
 * 429 → tentativa excessiva; demais → erro genérico.
 */
export function QueryError({ error, contract, onRetry }: { error: unknown; contract?: string | undefined; onRetry?: () => void }) {
  const { t } = useTranslation(["errors", "common"]);
  if (isApiError(error)) {
    if (error.kind === "forbidden") return <AccessDenied />;
    if (error.kind === "network" || error.kind === "server") return <BackendUnavailable onRetry={onRetry} />;
    if (error.kind === "notFound") return <DataUnavailable contract={contract} />;
    if (error.kind === "rateLimited")
      return (
        <div role="alert" className="flex flex-col items-center gap-3 p-8 text-center">
          <Clock className="size-6 text-warning-foreground" aria-hidden />
          <p>{t("errors:api.rateLimited")}</p>
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              {t("common:actions.retry")}
            </Button>
          )}
        </div>
      );
    return <ErrorState description={t(`errors:${error.messageKey}`)} onRetry={onRetry} />;
  }
  return <ErrorState onRetry={onRetry} />;
}

export function QueryBoundary<T>({
  query,
  contract,
  children,
}: {
  query: { data: T | undefined; isPending: boolean; error: unknown; refetch: () => unknown };
  contract?: string;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) return <LoadingState />;
  if (query.error || query.data === undefined)
    return <QueryError error={query.error} contract={contract} onRetry={() => void query.refetch()} />;
  return <>{children(query.data)}</>;
}
