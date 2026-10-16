import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LogIn } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { enterCompany } from "@/shared/auth/auth-service";

/** Entra no painel operacional da empresa como administrador (sessão delegada). */
export function EnterCompanyButton({ companyId }: { companyId: string }) {
  const { t } = useTranslation("platform");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setBusy(true);
    try {
      await enterCompany(companyId);
      queryClient.clear();
      await navigate({ to: "/app/dashboard" });
    } catch {
      toast.error(t("companies.detail.enterError"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button size="sm" onClick={() => void handle()} disabled={busy}>
      <LogIn className="size-4" aria-hidden /> {t("companies.access")}
    </Button>
  );
}
