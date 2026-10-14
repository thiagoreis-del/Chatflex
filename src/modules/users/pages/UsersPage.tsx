import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Copy, Info, KeyRound, Lock, MessageCircle, Pencil, Plus, Search, Trash2, Unlock, Wand2 } from "lucide-react";
import { env } from "@/shared/config/env";
import { accessMessage, generatePassword, whatsappLink, type AccessData } from "../access";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ApiError } from "@/shared/api/errors";
import { userKeys } from "@/shared/api/query-keys";
import { queuesQuery } from "@/modules/queues/api";
import type { Queue } from "@/modules/queues/types";
import {
  createUser,
  deleteUser,
  resetUserPassword,
  setUserBlocked,
  updateUser,
  usersContract,
  usersQuery,
} from "../api";
import type { CompanyUser, CompanyUserInput, UserProfile } from "../types";

export function UsersPage() {
  const { t } = useTranslation("team");
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery(usersQuery({ search, page }));
  const queues = useQuery(queuesQuery());
  const queueMap = new Map((queues.data ?? []).map((q) => [q.id, q]));
  const [form, setForm] = useState<CompanyUser | "new" | null>(null);
  const [toDelete, setToDelete] = useState<CompanyUser | null>(null);
  const [toReset, setToReset] = useState<CompanyUser | null>(null);
  const [toBlock, setToBlock] = useState<CompanyUser | null>(null);
  const [access, setAccess] = useState<AccessData | null>(null);
  const block = useMutation({
    mutationFn: (v: { u: CompanyUser; blocked: boolean }) => setUserBlocked(v.u, v.blocked),
    onSuccess: (_r, v) => {
      toast.success(t(v.blocked ? "toast.blocked" : "toast.unblocked"));
      void invalidate();
    },
    onError: () => toast.error(t("toast.error")),
  });
  const reset = useMutation({
    mutationFn: async (u: CompanyUser) => {
      const password = generatePassword();
      await resetUserPassword(u, password);
      return { company: env.appName, email: u.email, password };
    },
    onSuccess: (a) => {
      toast.success(t("toast.reset"));
      setAccess(a);
    },
    onError: () => toast.error(t("toast.error")),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: userKeys.all });
  const remove = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success(t("toast.deleted"));
      void invalidate();
    },
    onError: () => toast.error(t("toast.error")),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("users.title")}
        description={t("users.description")}
        actions={
          <Button onClick={() => setForm("new")}>
            <Plus className="size-4" aria-hidden />
            {t("users.new")}
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
          placeholder={t("users.searchPlaceholder")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>
      <QueryBoundary query={query} contract={usersContract}>
        {(result) =>
          result.data.length === 0 ? (
            <EmptyState title={t("users.empty")} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("users.table.name")}</TableHead>
                    <TableHead>{t("users.table.email")}</TableHead>
                    <TableHead>{t("users.table.profile")}</TableHead>
                    <TableHead>{t("users.table.queues")}</TableHead>
                    <TableHead>{t("users.table.status")}</TableHead>
                    <TableHead className="w-44 text-right">{t("users.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.data.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.profile === "admin" ? "default" : "secondary"}>
                          {t(`users.profile.${u.profile}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex flex-wrap gap-1">
                          {u.queueIds.map((id) => {
                            const q = queueMap.get(id);
                            return q ? <QueueChip key={id} queue={q} /> : null;
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.blocked ? "destructive" : "outline"}>
                          {t(u.blocked ? "users.status.blocked" : "users.status.active")}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={t("actions.resetPassword")}
                          title={t("actions.resetPassword")}
                          onClick={() => setToReset(u)}
                        >
                          <KeyRound className="size-4" aria-hidden />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={t(u.blocked ? "actions.unblock" : "actions.block")}
                          title={t(u.blocked ? "actions.unblock" : "actions.block")}
                          onClick={() =>
                            u.blocked ? block.mutate({ u, blocked: false }) : setToBlock(u)
                          }
                        >
                          {u.blocked ? (
                            <Unlock className="size-4" aria-hidden />
                          ) : (
                            <Lock className="size-4" aria-hidden />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={t("actions.edit")}
                          onClick={() => setForm(u)}
                        >
                          <Pencil className="size-4" aria-hidden />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={t("actions.delete")}
                          onClick={() => setToDelete(u)}
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
        <UserFormDialog
          value={form}
          queues={queues.data ?? []}
          onClose={() => setForm(null)}
          onSaved={invalidate}
          onAccess={setAccess}
        />
      )}
      {access && <AccessDialog access={access} onClose={() => setAccess(null)} />}
      <ConfirmDialog
        open={!!toReset}
        onOpenChange={(o) => !o && setToReset(null)}
        title={t("users.confirmReset.title")}
        description={t("users.confirmReset.description", { name: toReset?.name })}
        confirmLabel={t("actions.resetPassword")}
        onConfirm={() => toReset && reset.mutate(toReset)}
      />
      <ConfirmDialog
        open={!!toBlock}
        onOpenChange={(o) => !o && setToBlock(null)}
        title={t("users.confirmBlock.title")}
        description={t("users.confirmBlock.description", { name: toBlock?.name })}
        confirmLabel={t("actions.block")}
        onConfirm={() => toBlock && block.mutate({ u: toBlock, blocked: true })}
      />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t("users.confirmDelete.title")}
        description={t("users.confirmDelete.description", { name: toDelete?.name })}
        confirmLabel={t("actions.delete")}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
      />
    </div>
  );
}

export async function copyAccess(a: AccessData, okMsg: string) {
  await navigator.clipboard.writeText(accessMessage(a));
  toast.success(okMsg);
}

function AccessDialog({ access, onClose }: { access: AccessData; onClose: () => void }) {
  const { t } = useTranslation("team");
  const text = accessMessage(access);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("users.access.title")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t("users.access.description")}</p>
        <pre className="whitespace-pre-wrap rounded-lg border bg-muted/40 p-3 text-sm">{text}</pre>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => void copyAccess(access, t("toast.copied"))}>
            <Copy className="size-4" aria-hidden />
            {t("actions.copy")}
          </Button>
          <Button asChild>
            <a href={whatsappLink(text)} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" aria-hidden />
              {t("actions.whatsapp")}
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QueueChip({ queue }: { queue: Queue }) {
  return (
    <Badge variant="outline" className="gap-1.5">
      <span className="size-2 rounded-full" style={{ backgroundColor: queue.color }} aria-hidden />
      {queue.name}
    </Badge>
  );
}

function UserFormDialog({
  value,
  queues,
  onClose,
  onSaved,
  onAccess,
}: {
  value: CompanyUser | "new";
  queues: Queue[];
  onClose: () => void;
  onSaved: () => unknown;
  onAccess: (a: AccessData) => void;
}) {
  const [after, setAfter] = useState<"none" | "copy" | "whatsapp">("none");
  const { t } = useTranslation("team");
  const editing = value !== "new" ? value : null;
  const [data, setData] = useState<CompanyUserInput>({
    name: editing?.name ?? "",
    email: editing?.email ?? "",
    profile: editing?.profile ?? "user",
    queueIds: editing?.queueIds ?? [],
    blocked: editing?.blocked ?? false,
    password: editing ? "" : generatePassword(),
  });
  const [errors, setErrors] = useState({ name: false, email: false, password: false });

  const save = useMutation({
    mutationFn: () => {
      const body = { ...data };
      if (!body.password) delete body.password;
      return editing ? updateUser(editing.id, body) : createUser(body);
    },
    onSuccess: async () => {
      toast.success(t("toast.saved"));
      void onSaved();
      const a = { company: env.appName, email: data.email, password: data.password ?? "" };
      if (a.password && after === "copy") await copyAccess(a, t("toast.copied")).catch(() => {});
      if (a.password && after === "whatsapp")
        window.open(whatsappLink(accessMessage(a)), "_blank", "noopener");
      onClose();
      if (a.password) onAccess(a);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError && err.kind === "conflict" ? t("toast.conflict") : t("toast.error"),
      ),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const pwd = data.password ?? "";
    const next = {
      name: !data.name.trim(),
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
      password: editing ? pwd.length > 0 && pwd.length < 8 : pwd.length < 8,
    };
    setErrors(next);
    if (!Object.values(next).some(Boolean)) save.mutate();
  };

  const toggleQueue = (id: number, on: boolean) =>
    setData({
      ...data,
      queueIds: on ? [...data.queueIds, id] : data.queueIds.filter((x) => x !== id),
    });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form className="space-y-4" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{editing ? t("users.edit") : t("users.new")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="u-name">{t("users.form.name")}</Label>
            <Input
              id="u-name"
              value={data.name}
              aria-invalid={errors.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{t("users.form.nameRequired")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-email">{t("users.form.email")}</Label>
            <Input
              id="u-email"
              type="email"
              value={data.email}
              aria-invalid={errors.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{t("users.form.emailInvalid")}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="u-password">{t("users.form.password")}</Label>
              <div className="flex gap-2">
                <Input
                  id="u-password"
                  type="text"
                  autoComplete="new-password"
                  value={data.password}
                  aria-invalid={errors.password}
                  onChange={(e) => setData({ ...data, password: e.target.value })}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label={t("users.form.generate")}
                  title={t("users.form.generate")}
                  onClick={() => setData({ ...data, password: generatePassword() })}
                >
                  <Wand2 className="size-4" aria-hidden />
                </Button>
              </div>
              {errors.password ? (
                <p className="text-xs text-destructive">{t("users.form.passwordMin")}</p>
              ) : (
                editing && (
                  <p className="text-xs text-muted-foreground">{t("users.form.passwordHint")}</p>
                )
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-profile">{t("users.form.profile")}</Label>
              <Select
                value={data.profile}
                onValueChange={(v) => setData({ ...data, profile: v as UserProfile })}
              >
                <SelectTrigger id="u-profile">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t("users.profile.user")}</SelectItem>
                  <SelectItem value="supervisor">{t("users.profile.supervisor")}</SelectItem>
                  <SelectItem value="admin">{t("users.profile.admin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t("users.form.queues")}</legend>
            {queues.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("users.form.noQueues")}</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {queues.map((q) => (
                  <label key={q.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={data.queueIds.includes(q.id)}
                      onCheckedChange={(c) => toggleQueue(q.id, c === true)}
                    />
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: q.color }}
                      aria-hidden
                    />
                    {q.name}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={!!data.blocked}
              onCheckedChange={(c) => setData({ ...data, blocked: c === true })}
            />
            {t("users.form.status")}
          </label>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("actions.cancel")}
            </Button>
            {data.password ? (
              <>
                <Button type="submit" variant="outline" disabled={save.isPending} onClick={() => setAfter("copy")}>
                  <Copy className="size-4" aria-hidden />
                  {t("users.form.saveCopy")}
                </Button>
                <Button type="submit" variant="outline" disabled={save.isPending} onClick={() => setAfter("whatsapp")}>
                  <MessageCircle className="size-4" aria-hidden />
                  {t("users.form.saveWhatsapp")}
                </Button>
              </>
            ) : null}
            <Button type="submit" disabled={save.isPending} onClick={() => setAfter("none")}>
              {t("users.form.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
