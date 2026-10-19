import { pageMeta } from "@/shared/config/meta";
import { createFileRoute } from "@tanstack/react-router";
import { SubscriptionsPage } from "@/modules/billing/pages/SubscriptionsPage";
import type { SubscriptionFilters } from "@/modules/billing/types";
import { parseListSearch } from "@/shared/router/search";

export const Route = createFileRoute("/app/plataforma/assinaturas")({
  head: () =>
    pageMeta("platform:subscriptions.meta", "platform:subscriptions.subtitle", { noindex: true }),
  validateSearch: (raw: Record<string, unknown>) =>
    parseListSearch<SubscriptionFilters>(raw, ["companyId", "status"]),
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <SubscriptionsPage
      search={search}
      setSearch={(s) => void navigate({ to: ".", search: (prev) => ({ ...prev, ...s }) })}
    />
  );
}
