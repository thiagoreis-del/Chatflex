import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/shared/auth/session-store";
import { closingMessageQuery, saveClosingMessage } from "./closing-message";

/** Editor da mensagem de agradecimento padrão da empresa (somente administradores). */
export function ClosingMessageCard() {
  const { t } = useTranslation("tickets");
  const qc = useQueryClient();
  const session = useSession();
  const companyId = String(session.user?.companyId ?? "");
  const q = useQuery(closingMessageQuery(companyId));
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (q.isLoading) return;
    setEnabled(q.data?.enabled ?? false);
    setMessage(q.data?.message || t("closing.default"));
  }, [q.isLoading, q.data, t]);

  const save = async () => {
    setSaving(true);
    try {
      await saveClosingMessage({ enabled, message: message.trim() });
      await qc.invalidateQueries({ queryKey: closingMessageQuery(companyId).queryKey });
      toast.success(t("closing.saved"));
    } catch {
      toast.error(t("closing.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <div>
        <h2 className="text-sm font-semibold">{t("closing.settingsTitle")}</h2>
        <p className="text-xs text-muted-foreground">{t("closing.settingsDescription")}</p>
      </div>
      <label className="flex items-center justify-between gap-3 text-sm font-medium">
        {t("closing.settingsToggle")}
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </label>
      <Textarea
        rows={4}
        maxLength={1000}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        aria-label={t("closing.message")}
      />
      <div className="flex justify-end">
        <Button onClick={() => void save()} disabled={saving || !message.trim()}>
          {t("closing.save")}
        </Button>
      </div>
    </section>
  );
}
