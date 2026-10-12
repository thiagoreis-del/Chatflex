import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "@/app/pages/NotFoundPage";
import { pageMeta } from "@/shared/config/meta";

export const Route = createFileRoute("/404")({
  head: () => pageMeta("errors:404.meta", "errors:404.description", { noindex: true }),
  component: NotFoundPage,
});
