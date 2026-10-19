import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowLeft,
  Hash,
  MessageSquarePlus,
  Paperclip,
  Search,
  Send,
  UserMinus,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { EmptyState, QueryBoundary } from "@/shared/components";
import { internalChatKeys } from "@/shared/api/query-keys";
import { useSession } from "@/shared/auth/session-store";
import { usersQuery } from "@/modules/users/api";
import { queuesQuery } from "@/modules/queues/api";
import { AudioRecorder } from "@/modules/tickets/components/AudioRecorder";
import { useFallbackInterval } from "@/modules/tickets/realtime";
import {
  addInternalMember,
  createInternalConversation,
  internalConversationsQuery,
  internalMessagesQuery,
  removeInternalMember,
  sendInternalMedia,
  sendInternalMessage,
} from "../api";
import type { InternalConversation, InternalConversationKind, InternalMessage } from "../types";

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const KIND_ICONS: Record<InternalConversationKind, typeof UserRound> = {
  direct: UserRound,
  group: Users,
  queue: Hash,
};

/** Destaca @menções no corpo da mensagem. */
function BodyWithMentions({ body }: { body: string }) {
  const parts = body.split(/(@[\p{L}\p{N}._-]+)/gu);
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
      {parts.map((part, i) =>
        part.startsWith("@") ? (
          <mark key={i} className="rounded bg-primary/15 px-0.5 font-semibold text-primary">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
}

export function InternalChatPage() {
  const { t } = useTranslation("internalChat");
  const session = useSession();
  const companyId = String(session.user?.companyId ?? "");
  const qc = useQueryClient();
  const fallback = useFallbackInterval();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InternalConversation | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const conversations = useQuery({
    ...internalConversationsQuery(companyId),
    refetchInterval: fallback,
  });

  const filtered = useMemo(() => {
    const list = conversations.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations.data, search]);

  return (
    <div className="tickets-workspace flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg border bg-card shadow-sm">
      <aside
        className={cn(
          "flex min-h-0 min-w-0 w-full flex-col border-r bg-card md:w-80 md:shrink-0 xl:w-96",
          selected && "hidden md:flex",
        )}
      >
        <div className="space-y-2.5 border-b px-3 pb-2.5 pt-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="font-display text-lg font-semibold tracking-tight">{t("title")}</h1>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={t("new")}
              title={t("new")}
              onClick={() => setCreateOpen(true)}
            >
              <MessageSquarePlus className="size-4" />
            </Button>
          </div>
          <div className="relative">
            <Search
              className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search")}
              aria-label={t("search")}
              className="h-9 rounded-full bg-muted/60 pl-8 pr-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label={t("search")}
                className="absolute right-2 top-2 rounded-full p-0.5 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <p className="text-[11px] leading-snug text-muted-foreground">{t("privateNotice")}</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <QueryBoundary query={conversations}>
            {() =>
              filtered.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">{t("empty")}</p>
              ) : (
                <ul>
                  {filtered.map((c) => {
                    const Icon = KIND_ICONS[c.kind];
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(c)}
                          className={cn(
                            "flex w-full items-center gap-3 border-b px-3 py-3 text-left hover:bg-muted/50",
                            selected?.id === c.id && "bg-muted",
                          )}
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Icon className="size-4" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-semibold">{c.title}</span>
                              <span className="shrink-0 text-[11px] text-muted-foreground">
                                {time(c.updatedAt)}
                              </span>
                            </span>
                            <span className="flex items-center justify-between gap-2">
                              <span className="truncate text-xs text-muted-foreground">
                                {c.lastMessage ?? t(`kinds.${c.kind}`)}
                              </span>
                              {c.unreadMessages > 0 && (
                                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                  {c.unreadMessages > 99 ? "99+" : c.unreadMessages}
                                </span>
                              )}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )
            }
          </QueryBoundary>
        </div>
      </aside>
      <section
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col",
          selected ? "chat-open" : "hidden md:flex",
        )}
      >
        {selected ? (
          <InternalConversationView
            key={selected.id}
            conversation={selected}
            onBack={() => setSelected(null)}
            onChanged={() =>
              void qc.invalidateQueries({ queryKey: internalChatKeys.conversations(companyId) })
            }
          />
        ) : (
          <div className="m-auto">
            <EmptyState title={t("selectTitle")} description={t("selectDescription")} />
          </div>
        )}
      </section>
      <NewConversationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(c) => {
          setCreateOpen(false);
          setSelected(c);
          void qc.invalidateQueries({ queryKey: internalChatKeys.conversations(companyId) });
        }}
      />
    </div>
  );
}

function InternalConversationView({
  conversation,
  onBack,
  onChanged,
}: {
  conversation: InternalConversation;
  onBack: () => void;
  onChanged: () => void;
}) {
  const { t } = useTranslation("internalChat");
  const { t: tt } = useTranslation("tickets");
  const qc = useQueryClient();
  const fallback = useFallbackInterval();
  const messages = useQuery({
    ...internalMessagesQuery(conversation.id),
    refetchInterval: fallback,
  });
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.data?.length]);

  const send = useMutation({
    mutationFn: async ({ body, media }: { body: string; media: File | null }) => {
      if (media) return sendInternalMedia(conversation.id, media, body);
      return sendInternalMessage(conversation.id, body);
    },
    onSuccess: (message) => {
      setText("");
      setFile(null);
      if (message?.id) {
        qc.setQueryData<InternalMessage[]>(internalChatKeys.messages(conversation.id), (p = []) =>
          p.some((m) => m.id === message.id) ? p : [...p, message],
        );
      }
      onChanged();
    },
    onError: () => toast.error(t("toast.sendError")),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if ((body || file) && !send.isPending) send.mutate({ body, media: file });
  };

  const Icon = KIND_ICONS[conversation.kind];

  return (
    <>
      <header className="flex shrink-0 items-center gap-2 border-b px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4 sm:py-3">
        <Button
          variant="ghost"
          size="icon"
          className="-mr-1 shrink-0 md:hidden"
          onClick={onBack}
          aria-label={tt("actions.back")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{conversation.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {t(`kinds.${conversation.kind}`)} ·{" "}
            {conversation.participants.map((p) => p.name).join(", ")}
          </p>
        </div>
        {conversation.kind !== "direct" && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label={t("members.manage")}
            title={t("members.manage")}
            onClick={() => setMembersOpen(true)}
          >
            <Users className="size-4" />
          </Button>
        )}
      </header>
      {membersOpen && (
        <ManageMembersDialog
          conversation={conversation}
          open={membersOpen}
          onOpenChange={setMembersOpen}
          onChanged={onChanged}
        />
      )}
      <div className="chat-messages min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-6">
        <QueryBoundary query={messages}>
          {() => (
            <>
              <ul className="space-y-1.5">
                {(messages.data ?? []).map((m) => (
                  <li key={m.id} className={cn("flex", m.fromMe ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-lg px-2.5 py-1.5 shadow-sm sm:max-w-[70%]",
                        m.fromMe ? "chat-outgoing" : "bg-card",
                      )}
                    >
                      {!m.fromMe && m.sender?.name && (
                        <p className="text-[11px] font-semibold text-primary">{m.sender.name}</p>
                      )}
                      {m.mediaUrl && (
                        <a
                          href={m.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mb-1 block text-xs font-medium underline"
                        >
                          {m.mediaType?.startsWith("image/")
                            ? tt("reply.image")
                            : m.mediaType?.startsWith("audio/")
                              ? tt("reply.audio")
                              : m.mediaType?.startsWith("video/")
                                ? tt("reply.video")
                                : tt("reply.document")}
                        </a>
                      )}
                      {m.body && <BodyWithMentions body={m.body} />}
                      <p className="mt-0.5 text-right text-[10px] opacity-70">
                        {time(m.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div ref={endRef} />
            </>
          )}
        </QueryBoundary>
      </div>
      <form
        onSubmit={submit}
        className="flex shrink-0 items-end gap-1.5 border-t bg-card px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4"
      >
        <input
          ref={fileInput}
          type="file"
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("composer.attach")}
          title={t("composer.attach")}
          onClick={() => fileInput.current?.click()}
        >
          <Paperclip className="size-4" />
        </Button>
        <AudioRecorder
          labels={{
            start: tt("audio.start"),
            stop: tt("audio.stop"),
            cancel: tt("audio.cancel"),
            recording: tt("audio.recording"),
            unsupported: tt("audio.unsupported"),
          }}
          onReady={(f) => send.mutate({ body: "", media: f })}
          onError={(reason) => toast.error(tt(`audio.errors.${reason}`))}
        />
        <div className="min-w-0 flex-1">
          {file && (
            <p className="mb-1 flex items-center gap-1 truncate rounded bg-muted px-2 py-1 text-xs">
              <Paperclip className="size-3" aria-hidden />
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => setFile(null)}
                aria-label={tt("composer.removeAttachment")}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </p>
          )}
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("composer.placeholder")}
            aria-label={t("composer.placeholder")}
            className="h-10 rounded-full bg-muted/60"
          />
        </div>
        <Button
          type="submit"
          size="icon"
          className="size-10 rounded-full"
          disabled={send.isPending || (!text.trim() && !file)}
          aria-label={t("composer.send")}
        >
          <Send className="size-4" />
        </Button>
      </form>
    </>
  );
}

function NewConversationDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (c: InternalConversation) => void;
}) {
  const { t } = useTranslation("internalChat");
  const session = useSession();
  const myId = Number(session.user?.id) || null;
  const [kind, setKind] = useState<InternalConversationKind>("direct");
  const [name, setName] = useState("");
  const [queueId, setQueueId] = useState("");
  const [members, setMembers] = useState<number[]>([]);

  const users = useQuery({ ...usersQuery({ search: "", page: 1 }), enabled: open });
  const queues = useQuery({ ...queuesQuery(), enabled: open });
  const others = (users.data?.data ?? []).filter((u) => u.id !== myId);

  const create = useMutation({
    mutationFn: () =>
      createInternalConversation({
        kind,
        userIds: members,
        ...(kind === "group" ? { name: name.trim() } : {}),
        ...(kind === "queue" && queueId ? { queueId: Number(queueId) } : {}),
      }),
    onSuccess: onCreated,
    onError: () => toast.error(t("create.error")),
  });

  const toggleMember = (id: number) =>
    setMembers((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const valid =
    kind === "queue"
      ? !!queueId
      : kind === "group"
        ? name.trim().length > 0 && members.length > 0
        : members.length === 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("create.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted/50 p-1">
            {(["direct", "group", "queue"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn(
                  "min-h-11 rounded-md px-2 text-xs font-semibold",
                  kind === k
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted",
                )}
                aria-pressed={kind === k}
              >
                {t(`create.${k}`)}
              </button>
            ))}
          </div>
          {kind === "group" && (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("create.namePlaceholder")}
              aria-label={t("create.name")}
            />
          )}
          {kind === "queue" ? (
            <select
              value={queueId}
              onChange={(e) => setQueueId(e.target.value)}
              aria-label={t("create.queueLabel")}
              className="h-10 w-full rounded-md border bg-background px-2 text-sm"
            >
              <option value="">{t("create.queuePlaceholder")}</option>
              {(queues.data ?? []).map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="max-h-56 overflow-y-auto rounded-md border">
              <p className="border-b px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                {t("create.members")}
              </p>
              {others.map((u) => (
                <label
                  key={u.id}
                  className="flex min-h-11 cursor-pointer items-center gap-2 border-b px-3 py-2 text-sm last:border-0 hover:bg-muted/50"
                >
                  <input
                    type={kind === "direct" ? "radio" : "checkbox"}
                    name="members"
                    checked={members.includes(u.id)}
                    onChange={() => (kind === "direct" ? setMembers([u.id]) : toggleMember(u.id))}
                  />
                  <span className="truncate">{u.name}</span>
                </label>
              ))}
              {others.length === 0 && (
                <p className="px-3 py-3 text-sm text-muted-foreground">{t("empty")}</p>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("create.cancel")}
            </Button>
            <Button
              type="button"
              disabled={!valid || create.isPending}
              onClick={() => create.mutate()}
            >
              {t("create.submit")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ManageMembersDialog({
  conversation,
  open,
  onOpenChange,
  onChanged,
}: {
  conversation: InternalConversation;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChanged: () => void;
}) {
  const { t } = useTranslation("internalChat");
  const session = useSession();
  const myId = Number(session.user?.id) || null;
  const [addId, setAddId] = useState("");

  const users = useQuery({ ...usersQuery({ search: "", page: 1 }), enabled: open });
  const participantIds = new Set(conversation.participants.map((p) => p.id));
  const candidates = (users.data?.data ?? []).filter((u) => !participantIds.has(u.id));

  const add = useMutation({
    mutationFn: (userId: number) => addInternalMember(conversation.id, userId),
    onSuccess: () => {
      setAddId("");
      toast.success(t("members.added"));
      onChanged();
    },
    onError: () => toast.error(t("members.error")),
  });

  const remove = useMutation({
    mutationFn: (userId: number) => removeInternalMember(conversation.id, userId),
    onSuccess: () => {
      toast.success(t("members.removed"));
      onChanged();
    },
    onError: () => toast.error(t("members.error")),
  });

  const busy = add.isPending || remove.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("members.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="max-h-56 overflow-y-auto rounded-md border">
            <p className="border-b px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              {t("members.current")}
            </p>
            <ul>
              {conversation.participants.map((p) => (
                <li
                  key={p.id}
                  className="flex min-h-11 items-center gap-2 border-b px-3 py-2 text-sm last:border-0"
                >
                  <span className="truncate flex-1">{p.name}</span>
                  {p.id !== myId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive"
                      disabled={busy}
                      aria-label={t("members.remove", { name: p.name })}
                      title={t("members.remove", { name: p.name })}
                      onClick={() => remove.mutate(p.id)}
                    >
                      <UserMinus className="size-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-end gap-2">
            <select
              value={addId}
              onChange={(e) => setAddId(e.target.value)}
              aria-label={t("members.add")}
              className="h-10 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm"
            >
              <option value="">{t("members.add")}</option>
              {candidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              disabled={!addId || busy}
              onClick={() => add.mutate(Number(addId))}
            >
              <UserPlus className="size-4" aria-hidden />
              {t("members.addAction")}
            </Button>
          </div>
          {candidates.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("members.noMoreUsers")}</p>
          )}
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("members.close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
