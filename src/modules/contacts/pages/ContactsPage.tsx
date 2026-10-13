import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Info, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Pagination,
  QueryBoundary,
} from "@/shared/components";
import { contactKeys } from "@/shared/api/query-keys";
import {
  contactsContract,
  contactsQuery,
  createContact,
  deleteContact,
  updateContact,
} from "../api";
import type { Contact, ContactInput } from "../types";

export function ContactsPage() {
  const { t } = useTranslation("contacts");
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery(contactsQuery({ search, page }));
  const [form, setForm] = useState<Contact | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Contact | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: contactKeys.all });
  const remove = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      toast.success(t("toast.deleted"));
      void invalidate();
    },
    onError: () => toast.error(t("toast.error")),
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
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          className="pl-9"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>
      <QueryBoundary query={query} contract={contactsContract}>
        {(result) =>
          result.data.length === 0 ? (
            <EmptyState title={t("empty")} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.name")}</TableHead>
                    <TableHead>{t("table.number")}</TableHead>
                    <TableHead>{t("table.email")}</TableHead>
                    <TableHead>{t("table.tags")}</TableHead>
                    <TableHead className="w-24 text-right">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.data.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.number}</TableCell>
                      <TableCell>{c.email ?? "—"}</TableCell>
                      <TableCell>
                        <span className="flex flex-wrap gap-1">
                          {(c.tags ?? []).map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={result.page}
                pageSize={result.pageSize}
                total={result.total}
                onPageChange={setPage}
              />
            </>
          )
        }
      </QueryBoundary>

      {form && (
        <ContactFormDialog value={form} onClose={() => setForm(null)} onSaved={invalidate} />
      )}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t("confirmDelete.title")}
        description={t("confirmDelete.description", { name: toDelete?.name })}
        confirmLabel={t("actions.delete")}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
      />
    </div>
  );
}

function ContactFormDialog({
  value,
  onClose,
  onSaved,
}: {
  value: Contact | "new";
  onClose: () => void;
  onSaved: () => unknown;
}) {
  const { t } = useTranslation("contacts");
  const editing = value !== "new" ? value : null;
  const [data, setData] = useState<ContactInput>({
    name: editing?.name ?? "",
    number: editing?.number ?? "",
    email: editing?.email ?? "",
    tags: editing?.tags ?? [],
  });
  const [tagsText, setTagsText] = useState((editing?.tags ?? []).join(", "));
  const [errors, setErrors] = useState<Record<string, boolean>>({});

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
    const next = {
      name: !data.name.trim(),
      number: !data.number.trim(),
      email: !!data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
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
              onChange={(e) => setData({ ...data, number: e.target.value })}
            />
            {errors.number && (
              <p className="text-xs text-destructive">{t("form.numberRequired")}</p>
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
