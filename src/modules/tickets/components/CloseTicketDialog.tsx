import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "@/shared/auth/session-store";
import { closingMessageQuery, saveClosingMessage } from "@/modules/settings/closing-message";

export function CloseTicketDialog({
  open,
  onOpenChange,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onConfirm: (message: string | null) => void;
}) {
  const { t } = useTranslation("tickets");
  const qc = useQueryClient();
  const session = useSession();
  const companyId = String(session.user?.companyId ?? "");
  const isAdmin = session.user?.role === "superadmin" || session.user?.role === "company_admin";
  const q = useQuery({ ...closingMessageQuery(companyId), enabled: open });
  const [enabled, setEnabled] = useState(true);
  const [message, setMessage] = useState("");
  const [saveDefault, setSaveDefault] = useState(false);

  useEffect(() => {
    if (!open || q.isLoading) return;
    setEnabled(q.data?.enabled ?? false);
    setMessage(q.data?.message || t("closing.default"));
    setSaveDefault(false);
  }, [open, q.isLoading, q.data, t]);

  const confirm = async () => {
    if (saveDefault) {
      try {
        await saveClosingMessage({ enabled, message: message.trim() });
        void qc.invalidateQueries({ queryKey: closingMessageQuery(companyId).queryKey });
        toast.success(t("closing.saved"));
      } catch {
        toast.error(t("closing.saveError"));
      }
    }
    onConfirm(enabled && message.trim() ? message.trim() : null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("closing.title")}</DialogTitle>
          <DialogDescription>{t("closing.description")}</DialogDescription>
        </DialogHeader>
        <label className="flex items-center justify-between gap-3 text-sm font-medium">
          {t("closing.toggle")}
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </label>
        {enabled && (
          <Textarea
            rows={4}
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-label={t("closing.message")}
          />
        )}
        {isAdmin && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={saveDefault} onCheckedChange={(v) => setSaveDefault(v === true)} />
            {t("closing.saveDefault")}
          </label>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("transfer.cancel")}
          </Button>
          <Button onClick={() => void confirm()} disabled={pending}>
            {t("actions.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
