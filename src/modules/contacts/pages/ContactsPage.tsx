import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
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
import { isValidNumber, normalizeNumber, parseContactsCsv, type ImportRow } from "../import";
import type { Contact, ContactInput } from "../types";

export function ContactsPage() {
  const { t } = useTranslation("contacts");
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery(contactsQuery({ search, page }));
  const [form, setForm] = useState<Contact | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Contact | null>(null);
  const [importing, setImporting] = useState(false);

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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImporting(true)}>
              <Upload className="size-4" aria-hidden />
              {t("import")}
            </Button>
            <Button onClick={() => setForm("new")}>
              <Plus className="size-4" aria-hidden />
              {t("new")}
            </Button>
          </div>
        }
      />
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
        <ContactFormDialog
          value={form}
          existing={query.data?.data ?? []}
          onClose={() => setForm(null)}
          onSaved={invalidate}
        />
      )}
      {importing && <ImportDialog onClose={() => setImporting(false)} onDone={invalidate} />}
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
  existing,
  onClose,
  onSaved,
}: {
  value: Contact | "new";
  existing: Contact[];
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
      number: !data.number.trim() || !isValidNumber(data.number),
      email: !!data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    const dup = existing.find(
      (c) => c.id !== editing?.id && normalizeNumber(c.number) === normalized,
    );
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
                const n = normalizeNumber(data.number);
                if (n) setData((d) => ({ ...d, number: n }));
              }}
            />
            {errors.number && (
              <p className="text-xs text-destructive">
                {data.number.trim() ? t("form.numberInvalid") : t("form.numberRequired")}
              </p>
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

function ImportDialog({ onClose, onDone }: { onClose: () => void; onDone: () => unknown }) {
  const { t } = useTranslation("contacts");
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ ok: number; failed: number } | null>(null);

  const valid = (rows ?? []).filter((r) => !r.skip);
  const skipped = (rows ?? []).filter((r) => r.skip);

  const readFile = async (file: File) => {
    const text = await file.text();
    setRows(
      parseContactsCsv(text, {
        invalidNumber: t("importDialog.skipInvalidNumber"),
        noName: t("importDialog.skipNoName"),
      }),
    );
    setResult(null);
  };

  const runImport = async () => {
    const total = valid.length;
    setProgress({ done: 0, total });
    let ok = 0;
    let failed = 0;
    for (const row of valid) {
      try {
        await createContact(row.input);
        ok += 1;
      } catch {
        failed += 1;
      }
      setProgress({ done: ok + failed, total });
    }
    setResult({ ok, failed });
    setProgress(null);
    void onDone();
    toast.success(t("importDialog.done", { ok, failed }));
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("importDialog.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("importDialog.description")}</p>
          <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {t("importDialog.example")}
          </p>
          <div className="space-y-2">
            <Label htmlFor="ct-import-file">{t("importDialog.file")}</Label>
            <Input
              id="ct-import-file"
              ref={fileRef}
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void readFile(f);
              }}
            />
          </div>
          {rows && (
            <p className="text-sm">
              {t("importDialog.preview", { valid: valid.length, skipped: skipped.length })}
            </p>
          )}
          {skipped.length > 0 && (
            <ul className="max-h-32 space-y-1 overflow-auto text-xs text-muted-foreground">
              {skipped.slice(0, 20).map((r, i) => (
                <li key={i}>
                  {r.input.name || r.input.number} — {r.skip}
                </li>
              ))}
            </ul>
          )}
          {progress && (
            <p className="text-sm" role="status">
              {t("importDialog.progress", progress)}
            </p>
          )}
          {result && <p className="text-sm">{t("importDialog.done", result)}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={!!progress}>
            {t("actions.cancel")}
          </Button>
          <Button onClick={runImport} disabled={valid.length === 0 || !!progress}>
            {t("importDialog.start", { count: valid.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
