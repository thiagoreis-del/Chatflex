import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LoadingState, QueryError } from "@/shared/components";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { impersonationContract, impersonationLogsQuery } from "../impersonation";

export function ImpersonationLogTable({ companyId }: { companyId?: string }) {
  const { t, i18n } = useTranslation("platform");
  const q = useQuery(impersonationLogsQuery());
  const [term, setTerm] = useState("");
  const rows = useMemo(() => {
    const s = term.trim().toLowerCase();
    return (q.data ?? [])
      .filter((l) => !companyId || l.companyId === companyId)
      .filter(
        (l) =>
          !s ||
          l.userName.toLowerCase().includes(s) ||
          (l.companyName ?? l.companyId).toLowerCase().includes(s),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [q.data, term, companyId]);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("audit.impersonation.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("audit.impersonation.subtitle")}</p>
        </div>
        <Input
          className="w-full sm:w-64"
          placeholder={t("audit.impersonation.search")}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>
      {q.isPending ? (
        <LoadingState />
      ) : q.error ? (
        <QueryError error={q.error} contract={impersonationContract} onRetry={() => void q.refetch()} />
      ) : rows.length === 0 ? (
        <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          {t("audit.impersonation.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="p-3">{t("audit.columns.date")}</th>
                <th className="p-3">{t("audit.columns.user")}</th>
                <th className="p-3">{t("audit.columns.company")}</th>
                <th className="p-3">{t("audit.columns.action")}</th>
                <th className="p-3">{t("audit.columns.origin")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="p-3 whitespace-nowrap">
                    {l.createdAt ? new Date(l.createdAt).toLocaleString(i18n.language) : "—"}
                  </td>
                  <td className="p-3">{l.userName}</td>
                  <td className="p-3">{l.companyName ?? l.companyId}</td>
                  <td className="p-3">
                    <Badge variant={l.action === "enter" ? "default" : "secondary"}>
                      {t(`audit.impersonation.${l.action}`)}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">{l.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
