import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { KeyRound, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/shared/components";
import { companyKeys, platformKeys } from "@/shared/api/query-keys";
import { deleteConnection, updateConnection } from "@/modules/whatsapp/api";
import type { WhatsAppConnection } from "@/modules/whatsapp/types";
import { generatePassword, type AccessData } from "@/modules/users/access";
import { deleteCompany, resetMemberPassword, runCompanyStatusAction } from "../api";
import type { Company } from "../types";

const isActive = (c: Company) => c.status !== "suspended" && c.status !== "cancelled";

/** Ativar/desativar e excluir empresa, com confirmação. */
export function CompanyQuickActions({ company, compact }: { company: Company; compact?: boolean }) {
  const { t } = useTranslation("platform");
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<"toggle" | "delete" | null>(null);
  const [typed, setTyped] = useState("");
  const active = isActive(company);
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: companyKeys.all }),
      qc.invalidateQueries({ queryKey: platformKeys.dashboard() }),
    ]);
  const toggle = useMutation({
    mutationFn: () =>
      runCompanyStatusAction(company.id, active ? "suspend" : "activate", "Ação rápida do superadmin"),
    onSuccess: async () => {
      toast.success(t("companyAdmin.done"));
      await refresh();
    },
    onError: () => toast.error(t("companyAdmin.error")),
  });
  const remove = useMutation({
    mutationFn: () => deleteCompany(company.id),
    onSuccess: async () => {
      toast.success(t("companyAdmin.deleted"));
      await refresh();
      if (!compact) await navigate({ to: "/app/plataforma/empresas", search: { page: 1 } });
    },
    onError: () => toast.error(t("companyAdmin.error")),
  });
  const size = compact ? "sm" : "default";
  return (
    <>
      <Button
        size={size}
        variant={compact ? "ghost" : "outline"}
        disabled={toggle.isPending}
        onClick={() => setConfirm("toggle")}
      >
        {active ? <PowerOff className="size-4" aria-hidden /> : <Power className="size-4" aria-hidden />}
        {active ? t("companyAdmin.deactivate") : t("companyAdmin.activate")}
      </Button>
      <Button
        size={size}
        variant={compact ? "ghost" : "destructive"}
        className={compact ? "text-destructive" : undefined}
        disabled={remove.isPending}
        onClick={() => {
          setTyped("");
          setConfirm("delete");
        }}
      >
        <Trash2 className="size-4" aria-hidden /> {t("companyAdmin.delete")}
      </Button>
      <ConfirmDialog
        open={confirm === "toggle"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t(active ? "companyAdmin.deactivateTitle" : "companyAdmin.activateTitle", {
          name: company.tradeName,
        })}
        description={t(active ? "companyAdmin.deactivateDescription" : "companyAdmin.activateDescription")}
        confirmLabel={active ? t("companyAdmin.deactivate") : t("companyAdmin.activate")}
        onConfirm={() => {
          setConfirm(null);
          toggle.mutate();
        }}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={t("companyAdmin.deleteTitle", { name: company.tradeName })}
        description={t("companyAdmin.deleteDescription")}
        confirmLabel={t("companyAdmin.delete")}
        onConfirm={() => {
          if (typed.trim().toUpperCase() !== "EXCLUIR") return;
          setConfirm(null);
          remove.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="confirm-delete">{t("companyAdmin.deleteTyped")}</Label>
          <Input id="confirm-delete" value={typed} onChange={(e) => setTyped(e.target.value)} />
        </div>
      </ConfirmDialog>
    </>
  );
}

/** Gera nova senha temporária para o usuário e devolve os dados de acesso. */
export function MemberAccessButton({
  member,
  companyName,
  onAccess,
}: {
  member: { id: string; name: string; email: string };
  companyName: string;
  onAccess: (a: AccessData) => void;
}) {
  const { t } = useTranslation("platform");
  const [open, setOpen] = useState(false);
  const m = useMutation({
    mutationFn: async () => {
      const password = generatePassword();
      await resetMemberPassword(member, password);
      return password;
    },
    onSuccess: (password) => onAccess({ company: companyName, email: member.email, password }),
    onError: () => toast.error(t("companyAdmin.error")),
  });
  return (
    <>
      <Button size="sm" variant="ghost" disabled={m.isPending} onClick={() => setOpen(true)}>
        <KeyRound className="size-4" aria-hidden /> {t("companyAdmin.access")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("companyAdmin.accessTitle", { name: member.name })}
        description={t("companyAdmin.accessDescription")}
        confirmLabel={t("companyAdmin.access")}
        onConfirm={() => {
          setOpen(false);
          m.mutate();
        }}
      />
    </>
  );
}

/** Editar e excluir conexão WhatsApp de uma empresa. */
export function ConnectionRowActions({
  connection,
  onChanged,
}: {
  connection: WhatsAppConnection;
  onChanged: () => void;
}) {
  const { t } = useTranslation("platform");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState(connection.name);
  const [isDefault, setIsDefault] = useState(!!connection.isDefault);
  const [greeting, setGreeting] = useState(connection.greetingMessage ?? "");
  const save = useMutation({
    mutationFn: () =>
      updateConnection(connection.id, { name: name.trim(), isDefault, greetingMessage: greeting }),
    onSuccess: () => {
      toast.success(t("companyAdmin.done"));
      setEditing(false);
      onChanged();
    },
    onError: () => toast.error(t("companyAdmin.error")),
  });
  const remove = useMutation({
    mutationFn: () => deleteConnection(connection.id),
    onSuccess: () => {
      toast.success(t("companyAdmin.done"));
      onChanged();
    },
    onError: () => toast.error(t("companyAdmin.error")),
  });
  return (
    <div className="flex justify-end gap-1">
      <Button size="sm" variant="ghost" onClick={() => setEditing(true)} aria-label={t("companyAdmin.connEdit")}>
        <Pencil className="size-4" aria-hidden />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-destructive"
        disabled={remove.isPending}
        onClick={() => setDeleting(true)}
        aria-label={t("companyAdmin.delete")}
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("companyAdmin.connEdit")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="conn-name">{t("companyAdmin.connName")}</Label>
              <Input id="conn-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conn-greeting">{t("companyAdmin.connGreeting")}</Label>
              <Textarea id="conn-greeting" value={greeting} onChange={(e) => setGreeting(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="conn-default" checked={isDefault} onCheckedChange={setIsDefault} />
              <Label htmlFor="conn-default">{t("companyAdmin.connDefault")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(false)}>
              {t("companyAdmin.cancel")}
            </Button>
            <Button disabled={!name.trim() || save.isPending} onClick={() => save.mutate()}>
              {t("companyAdmin.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t("companyAdmin.connDeleteTitle", { name: connection.name })}
        description={t("companyAdmin.connDeleteDescription")}
        confirmLabel={t("companyAdmin.delete")}
        onConfirm={() => {
          setDeleting(false);
          remove.mutate();
        }}
      />
    </div>
  );
}
