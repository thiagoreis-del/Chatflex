import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StatusPage } from "@/app/pages/StatusPage";
import { BackendUnavailable } from "@/shared/components";
import { pageMeta } from "@/shared/config/meta";

export const Route = createFileRoute("/indisponivel")({
  head: () => pageMeta("errors:unavailable.meta", "errors:unavailable.description", { noindex: true }),
  component: UnavailableRoute,
});

function UnavailableRoute() {
  const navigate = useNavigate();
  return (
    <StatusPage>
      <BackendUnavailable onRetry={() => void navigate({ to: "/app/dashboard" })} />
    </StatusPage>
  );
}
