import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DateDisplay, EmptyState } from "@/shared/components";
import { AuditResultBadge } from "@/modules/platform-admin/components/badges";
import type { AuditEvent } from "../types";

/** Somente leitura. Mostra apenas metadados; nunca conteúdo sensível. */
export function AuditEventTable({
  events,
  hideCompany = false,
}: {
  events: AuditEvent[];
  hideCompany?: boolean;
}) {
  const { t } = useTranslation("platform");
  if (!events.length) return <EmptyState title={t("audit.empty")} />;
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("audit.columns.date")}</TableHead>
            <TableHead>{t("audit.columns.user")}</TableHead>
            {!hideCompany && <TableHead>{t("audit.columns.company")}</TableHead>}
            <TableHead>{t("audit.columns.action")}</TableHead>
            <TableHead>{t("audit.columns.resource")}</TableHead>
            <TableHead>{t("audit.columns.result")}</TableHead>
            <TableHead>{t("audit.columns.reason")}</TableHead>
            <TableHead>{t("audit.columns.origin")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="whitespace-nowrap">
                <DateDisplay value={e.occurredAt} withTime />
              </TableCell>
              <TableCell>{e.actorName}</TableCell>
              {!hideCompany && <TableCell>{e.companyName ?? "—"}</TableCell>}
              <TableCell>
                <code className="text-xs">{e.action}</code>
              </TableCell>
              <TableCell className="text-sm">{e.resource}</TableCell>
              <TableCell>
                <AuditResultBadge result={e.result} />
              </TableCell>
              <TableCell className="max-w-64 truncate text-sm" title={e.reason ?? undefined}>
                {e.reason ?? "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{e.origin}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
