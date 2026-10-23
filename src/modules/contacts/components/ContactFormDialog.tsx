import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createContact, updateContact } from "../api";
import { isValidNumber, normalizeNumber } from "../import";
import type { Contact, ContactInput } from "../types";

/** Formulário de criar/editar contato, usado em Contatos e no Atendimento. */
export function ContactFormDialog({
  value,
  existing = [],
  onClose,
  onSaved,
}: {
  value: Contact | "new";
  existing?: Contact[];
  onClose: () => void;
  onSaved: () => unknown;
}) {
  const { t } = useTranslation("contacts");
  const editing = value !== "new" ? value : null;
  // Grupos não exigem número: renomear só precisa do nome.
  const isGroup = editing?.isGroup === true;
  const [data, setData] = useState<ContactInput>({
    name: editing?.name ?? "",
    number: editing?.number ?? "",
    email: editing?.email ?? "",
    tags: editing?.tags ?? [],
  });
  const [tagsText, setTagsText] = useState((editing?.tags ?? []).join(", "));
  const [errors, setErrors] = useState({ name: false, number: false, email: false });
  const [duplicate, setDuplicate] = useState<Contact | null>(null);

  const save = useMutation({
    mutationFn: () => (editing ? updateContact(editing.id, data) : createContact(data)),
    onSuccess: () => {
      toast.success(t("toast.saved"));
      void onSaved();
      onClose();
    },
    onError: () => toast.error(t("toast.error")),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeNumber(data.number);
    const next = {
      name: !data.name.trim(),
      number: !isGroup && (!data.number.trim() || !isValidNumber(data.number)),
      email: !!data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    let dup: Contact | undefined;
    if (!isGroup && normalized) {
      dup = existing.find((c) => c.id !== editing?.id && normalizeNumber(c.number) === normalized);
    }
    if (dup) {
      setDuplicate(dup);
      return;
    }
    setDuplicate(null);
    save.mutate();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form className="space-y-4" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{editing ? t("edit") : t("new")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ct-name">{t("form.name")}</Label>
            <Input
              id="ct-name"
              value={data.name}
              aria-invalid={errors.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
            />
            {errors.name && <p className="text-xs text-destructive">{t("form.nameRequired")}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ct-number">{t("form.number")}</Label>
            <Input
              id="ct-number"
              value={data.number}
              aria-invalid={errors.number}
              onChange={(e) => {
                setData({ ...data, number: e.target.value });
                setDuplicate(null);
              }}
              onBlur={() => {
                if (isGroup) return; // não normaliza JID de grupo
                const n = normalizeNumber(data.number);
                if (n) setData((d) => ({ ...d, number: n }));
              }}
            />
            {isGroup ? (
              <p className="text-xs text-muted-foreground">{t("form.numberGroupHint")}</p>
            ) : (
              errors.number && (
                <p className="text-xs text-destructive">
                  {data.number.trim() ? t("form.numberInvalid") : t("form.numberRequired")}
                </p>
              )
            )}
            {duplicate && (
              <p className="text-xs text-destructive">
                {t("form.duplicate", { name: duplicate.name })}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ct-email">{t("form.email")}</Label>
            <Input
              id="ct-email"
              type="email"
              value={data.email}
              aria-invalid={errors.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
            />
            {errors.email && <p className="text-xs text-destructive">{t("form.emailInvalid")}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ct-tags">{t("form.tags")}</Label>
            <Input
              id="ct-tags"
              value={tagsText}
              onChange={(e) => {
                setTagsText(e.target.value);
                setData({
                  ...data,
                  tags: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                });
              }}
            />
            <p className="text-xs text-muted-foreground">{t("form.tagsHint")}</p>
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
