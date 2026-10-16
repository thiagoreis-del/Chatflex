import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/shared/config/meta";
import { BackupsPage } from "@/modules/backup/pages/BackupsPage";

export const Route = createFileRoute("/app/plataforma/backups")({
  head: () => pageMeta("backups:meta", "backups:subtitle", { noindex: true }),
  component: BackupsPage,
});
