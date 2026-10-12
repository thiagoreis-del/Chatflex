import { createFileRoute } from "@tanstack/react-router";
import { PlatformDashboardPage } from "@/modules/platform-admin/pages/PlatformDashboardPage";

export const Route = createFileRoute("/app/plataforma/")({ component: PlatformDashboardPage });
