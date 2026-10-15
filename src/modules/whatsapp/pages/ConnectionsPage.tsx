import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { CheckCircle2, Info, Pencil, Plus, QrCode, Smartphone, Trash2, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ConfirmDialog,
  EmptyState,
  LoadingState,
  PageHeader,
  QueryBoundary,
} from "@/shared/components";
import { whatsappKeys } from "@/shared/api/query-keys";
import { isApiError } from "@/shared/api/errors";
import {
  connectionQuery,
  connectionsQuery,
  createConnection,
  deleteConnection,
  disconnectSession,
  refreshQr,
  startSession,
  updateConnection,
  whatsappContract,
} from "../api";
import type { WhatsAppConnection, WhatsAppInput, WhatsAppStatus } from "../types";

const statusVariant: Record<WhatsAppStatus, "default" | "secondary" | "destructive" | "outline"> = {
  CONNECTED: "default",
  DISCONNECTED: "destructive",
  qrcode: "secondary",
  OPENING: "secondary",
  PAIRING: "secondary",
  PENDING: "secondary",
  TIMEOUT: "outline",
};

/** O backend devolve `{ error }` (AppError) ou `{ message }`; mostra o texto real ao usuário. */
function serverMessage(error: unknown): string | undefined {
  if (!isApiError(error)) return undefined;
  const body = error.body as { error?: unknown; message?: unknown } | undefined;
  const text = typeof body?.error === "string" ? body.error : body?.message;
  if (typeof text !== "string" || !text.trim() || text.startsWith("ERR_")) return undefined;
  return text;
}

export function ConnectionsPage() {
  const { t } = useTranslation("whatsapp");
  const qc = useQueryClient();
  const query = useQuery(connectionsQuery());
  const [form, setForm] = useState<WhatsAppConnection | "new" | null>(null);
  const [qrId, setQrId] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<WhatsAppConnection | null>(null);
  const [toDisconnect, setToDisconnect] = useState<WhatsAppConnection | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: whatsappKeys.all });
  const onError = (error: unknown) =>
    toast.error(t("toast.error"), { description: serverMessage(error) });

  const connect = useMutation({
    mutationFn: startSession,
    onSuccess: (_d, id) => {
      setQrId(id);
      void invalidate();
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: deleteConnection,
    onSuccess: () => {
      toast.success(t("toast.deleted"));
      void invalidate();
    },
    onError,
  });
  const disconnect = useMutation({
    mutationFn: disconnectSession,
    onSuccess: () => {
      toast.success(t("toast.disconnected"));
      void invalidate();
    },
    onError,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button onClick={() => setForm("new")}>
            <Plus className="size-4" aria-hidden />
            {t("new")}
          </Button>
        }
      />
      <p className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <Info className="size-4 shrink-0" aria-hidden />
        {t("pending")}
      </p>
      <QueryBoundary query={query} contract={whatsappContract}>
        {(list) =>
          list.length === 0 ? (
            <EmptyState title={t("empty")} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((c) => (
                <Card key={c.id}>
                  <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 space-y-0">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Smartphone className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0 [overflow-wrap:anywhere]">
                        <CardTitle className="text-base">{c.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{c.number ?? t("noNumber")}</p>
                      </div>
                    </div>
                    {c.isDefault && <Badge variant="outline">{t("default")}</Badge>}
                  </CardHeader>
                  <CardContent>
                    <Badge variant={statusVariant[c.status]}>{t(`status.${c.status}`, { defaultValue: c.status })}</Badge>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2">
                    {c.status === "CONNECTED" ? (
                      <Button size="sm" variant="outline" onClick={() => setToDisconnect(c)}>
                        <Unplug className="size-4" aria-hidden />
                        {t("actions.disconnect")}
                      </Button>
                    ) : c.status === "qrcode" ? (
                      <Button size="sm" onClick={() => setQrId(c.id)}>
                        <QrCode className="size-4" aria-hidden />
                        {t("actions.showQr")}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={connect.isPending}
                        onClick={() => connect.mutate(c.id)}
                      >
                        <QrCode className="size-4" aria-hidden />
                        {t("actions.connect")}
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={t("actions.edit")}
                      onClick={() => setForm(c)}
                    >
                      <Pencil className="size-4" aria-hidden />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={t("actions.delete")}
                      onClick={() => setToDelete(c)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )
        }
      </QueryBoundary>

      {form && (
        <ConnectionFormDialog
          value={form}
          onClose={() => setForm(null)}
          onSaved={invalidate}
          onCreated={(created) => connect.mutate(created.id)}
        />
      )}
      {qrId !== null && (
        <QrDialog
          id={qrId}
          onClose={() => {
            setQrId(null);
            void invalidate();
          }}
        />
      )}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t("confirmDelete.title")}
        description={t("confirmDelete.description", { name: toDelete?.name })}
        confirmLabel={t("actions.delete")}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
      />
      <ConfirmDialog
        open={!!toDisconnect}
        onOpenChange={(o) => !o && setToDisconnect(null)}
        title={t("confirmDisconnect.title")}
        description={t("confirmDisconnect.description")}
        confirmLabel={t("actions.disconnect")}
        onConfirm={() => toDisconnect && disconnect.mutate(toDisconnect.id)}
      />
    </div>
  );
}

function ConnectionFormDialog({
  value,
  onClose,
  onSaved,
  onCreated,
}: {
  value: WhatsAppConnection | "new";
  onClose: () => void;
  onSaved: () => unknown;
  onCreated?: (created: WhatsAppConnection) => void;
}) {
  const { t } = useTranslation("whatsapp");
  const editing = value !== "new" ? value : null;
  const [data, setData] = useState<WhatsAppInput>({
    name: editing?.name ?? "",
    isDefault: editing?.isDefault ?? false,
    greetingMessage: editing?.greetingMessage ?? "",
  });
  const [error, setError] = useState(false);
  const save = useMutation({
    mutationFn: () => (editing ? updateConnection(editing.id, data) : createConnection(data)),
    onSuccess: (saved) => {
      toast.success(t("toast.saved"));
      void onSaved();
      onClose();
      // O backend não inicia a sessão ao criar: já gera o QR para a conexão nova.
      if (!editing && saved && typeof saved.id === "number") onCreated?.(saved);
    },
    onError: (err) => toast.error(t("toast.error"), { description: serverMessage(err) }),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!data.name.trim()) return setError(true);
            save.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>{editing ? t("edit") : t("new")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="wa-name">{t("form.name")}</Label>
            <Input
              id="wa-name"
              value={data.name}
              aria-invalid={error}
              onChange={(e) => {
                setError(false);
                setData({ ...data, name: e.target.value });
              }}
            />
            {error && <p className="text-xs text-destructive">{t("form.nameRequired")}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa-greet">{t("form.greeting")}</Label>
            <Textarea
              id="wa-greet"
              value={data.greetingMessage}
              onChange={(e) => setData({ ...data, greetingMessage: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="wa-default"
              checked={data.isDefault}
              onCheckedChange={(v) => setData({ ...data, isDefault: v })}
            />
            <Label htmlFor="wa-default">{t("form.isDefault")}</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {t("actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function QrDialog({ id, onClose }: { id: number; onClose: () => void }) {
  const { t } = useTranslation("whatsapp");
  const qc = useQueryClient();
  const [done, setDone] = useState(false);
  const [openedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const { data, error } = useQuery(connectionQuery(id, !done));
  const renew = useMutation({
    mutationFn: () => refreshQr(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: whatsappKeys.detail(id) }),
    onError: (err) => toast.error(t("toast.error"), { description: serverMessage(err) }),
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (data?.status !== "CONNECTED") return;
    setDone(true);
    const timer = setTimeout(onClose, 1500);
    return () => clearTimeout(timer);
  }, [data?.status, onClose]);

  const qr = typeof data?.qrcode === "string" ? data.qrcode.trim() : "";
  const waitedLong = now - openedAt > 45_000;
  // Sessão caiu (QR expirou/timeout) ou o servidor não gerou QR a tempo.
  const stalled =
    !done &&
    !qr &&
    (data?.status === "DISCONNECTED" || data?.status === "TIMEOUT" || waitedLong) &&
    !renew.isPending;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("qr.title")}</DialogTitle>
          <DialogDescription>{t("qr.steps")}</DialogDescription>
        </DialogHeader>
        <div className="grid min-h-64 place-items-center text-center">
          {done ? (
            <p className="flex items-center gap-2 font-medium text-primary">
              <CheckCircle2 className="size-5" aria-hidden />
              {t("qr.connected")}
            </p>
          ) : qr ? (
            <div className="rounded-xl bg-background p-3 ring-1 ring-border">
              <QRCodeSVG
                value={qr}
                size={240}
                level="L"
                marginSize={2}
                bgColor="#ffffff"
                fgColor="#000000"
                aria-label={t("qr.title")}
              />
            </div>
          ) : error ? (
            <p className="max-w-64 text-sm text-destructive">
              {serverMessage(error) ?? t("qr.loadError")}
            </p>
          ) : stalled ? (
            <p className="max-w-64 text-sm text-muted-foreground">{t("qr.expired")}</p>
          ) : (
            <LoadingState label={t("qr.waiting")} />
          )}
        </div>
        {!done && (
          <DialogFooter>
            <Button
              variant={stalled || error ? "default" : "outline"}
              disabled={renew.isPending}
              onClick={() => renew.mutate()}
            >
              {t("actions.newQr")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
