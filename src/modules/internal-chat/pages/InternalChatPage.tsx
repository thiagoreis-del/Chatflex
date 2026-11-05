import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  FileText,
  Forward,
  Hash,
  MessageSquarePlus,
  MoreVertical,
  Paperclip,
  Pencil,
  Plus,
  Reply,
  Search,
  Send,
  Smile,
  Trash2,
  UserMinus,
  UserPlus,
  UserRound,
  Users,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ConfirmDialog, EmptyState, QueryBoundary } from "@/shared/components";
import { internalChatKeys } from "@/shared/api/query-keys";
import { sessionStore, useSession } from "@/shared/auth/session-store";
import { usersQuery } from "@/modules/users/api";
import { queuesQuery } from "@/modules/queues/api";
import { AudioRecorder } from "@/modules/tickets/components/AudioRecorder";
import { MessageMedia } from "@/modules/tickets/components/MessageMedia";
import { ContactCard } from "@/modules/tickets/components/ContactCard";
import { LocationCard } from "@/modules/tickets/components/LocationCard";
import { ImageEditorDialog } from "@/modules/tickets/components/ImageEditorDialog";
import { isVCard, parseVCards } from "@/modules/tickets/vcard";
import { locationText, parseLocation } from "@/modules/tickets/location";
import { messageDateLabel, messageDayKey, startsMessageDay } from "@/modules/tickets/message-date";
import { useFallbackInterval } from "@/modules/tickets/realtime";
import {
  addInternalMember,
  createInternalConversation,
  deleteInternalConversation,
  internalConversationsQuery,
  internalMessagesQuery,
  removeInternalMember,
  sendInternalMedia,
  sendInternalMessage,
} from "../api";
import { ForwardInternalDialog } from "../components/ForwardInternalDialog";
import { hideMessageForMe, listHiddenMessages } from "../hidden";
import { encodeReplyBody, parseReplyBody, quoteSnippet, stripQuote } from "../quote";
import type { ReplyQuote } from "../quote";
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
            onDeleted={() => {
              setSelected(null);
              void qc.invalidateQueries({ queryKey: internalChatKeys.conversations(companyId) });
            }}
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
  onDeleted,
}: {
  conversation: InternalConversation;
  onBack: () => void;
  onChanged: () => void;
  onDeleted: () => void;
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
  const [files, setFiles] = useState<File[]>([]);
  const [active, setActive] = useState(0);
  const [replyTo, setReplyTo] = useState<InternalMessage | null>(null);
  const [forwarding, setForwarding] = useState<InternalMessage | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const [membersOpen, setMembersOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const currentUser = useSession().user;
  const canDelete =
    conversation.ownerId === Number(currentUser?.id) ||
    currentUser?.role === "company_admin" ||
    currentUser?.role === "superadmin";

  const scopeCompany = String(currentUser?.companyId ?? "");
  const scopeUser = String(currentUser?.id ?? "");

  useEffect(() => {
    setHidden(listHiddenMessages(scopeCompany, scopeUser));
  }, [scopeCompany, scopeUser]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.data?.length]);

  const file = files[active] ?? null;
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const mediaLabel = (m: InternalMessage) => {
    if (m.mediaType === "image") return t("reply.image");
    if (m.mediaType === "video") return t("reply.video");
    if (m.mediaType === "audio") return t("reply.audio");
    return m.mediaName ? `📄 ${m.mediaName}` : t("reply.document");
  };

  const quoteOf = (m: InternalMessage): ReplyQuote => {
    const clean = stripQuote(m.body);
    return {
      id: m.id,
      sender: m.fromMe ? t("reply.you") : (m.sender?.name ?? conversation.title),
      snippet:
        clean && isVCard(clean)
          ? t("reply.contact")
          : clean && parseLocation(clean)
            ? locationText(clean) || t("reply.location")
            : clean
              ? quoteSnippet(clean)
              : mediaLabel(m),
    };
  };

  const jumpTo = (id: string) => {
    document.getElementById(`imsg-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightId(id);
    window.setTimeout(() => setHighlightId((cur) => (cur === id ? null : cur)), 1800);
  };

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    setFiles((cur) => [...cur, ...Array.from(list)]);
    setActive(files.length);
  };
  const removeFile = (index: number) => {
    setFiles((cur) => cur.filter((_, i) => i !== index));
    setActive(0);
  };
  const replaceActive = (f: File) =>
    setFiles((cur) => cur.map((x, i) => (i === active ? f : x)));

  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      if (e.dataTransfer.types.includes("Files")) {
        e.preventDefault();
        setDragging(true);
      }
    },
    onDragLeave: (e: React.DragEvent) => {
      if (e.currentTarget === e.target) setDragging(false);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
  };

  const send = useMutation({
    mutationFn: async ({ body, media }: { body: string; media: File[] }) => {
      const quoted = replyTo ? encodeReplyBody(quoteOf(replyTo), body || " ") : body;
      // Como no WhatsApp: a legenda acompanha a primeira mídia enviada.
      if (media.length) {
        for (const [index, item] of media.entries()) {
          await sendInternalMedia(conversation.id, item, index === 0 ? quoted : "");
        }
        return;
      }
      await sendInternalMessage(conversation.id, quoted);
    },
    onSuccess: () => {
      setText("");
      setFiles([]);
      setActive(0);
      setReplyTo(null);
      void qc.invalidateQueries({ queryKey: internalChatKeys.messages(conversation.id) });
      onChanged();
    },
    onError: () => toast.error(t("toast.sendError")),
  });

  const remove = useMutation({
    mutationFn: () => deleteInternalConversation(conversation.id),
    onSuccess: () => {
      setDeleteOpen(false);
      qc.removeQueries({ queryKey: internalChatKeys.messages(conversation.id) });
      toast.success(t("delete.success"));
      onDeleted();
    },
    onError: () => toast.error(t("delete.error")),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if ((body || files.length) && !send.isPending) send.mutate({ body, media: files });
  };

  const replyQuote = replyTo ? quoteOf(replyTo) : null;
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
        {conversation.kind !== "direct" &&
          conversation.ownerId === Number(sessionStore.get().user?.id) && (
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
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-destructive hover:text-destructive"
            aria-label={t("delete.action")}
            title={t("delete.action")}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </header>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("delete.title")}
        description={t("delete.description", { name: conversation.title })}
        confirmLabel={t("delete.confirm")}
        onConfirm={() => remove.mutate()}
      />
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
                {(messages.data ?? [])
                  .filter((m) => !hidden.includes(m.id))
                  .map((m, index, visible) => {
                    const parsed = parseReplyBody(m.body);
                    const cleanBody = parsed.body.trim();
                    return (
                      <Fragment key={m.id}>
                        {startsMessageDay(m.createdAt, visible[index - 1]?.createdAt) && (
                          <li className="flex justify-center py-2">
                            <time
                              dateTime={messageDayKey(m.createdAt) ?? undefined}
                              className="max-w-full rounded-md border border-border bg-card px-3 py-1.5 text-center text-xs font-semibold text-muted-foreground shadow-sm"
                            >
                              {messageDateLabel(m.createdAt, {
                                today: t("dates.today"),
                                yesterday: t("dates.yesterday"),
                              })}
                            </time>
                          </li>
                        )}
                        <li
                          id={`imsg-${m.id}`}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setReplyTo(m);
                          }}
                          className={cn(
                            "group flex items-center gap-1",
                            m.fromMe ? "flex-row-reverse" : "flex-row",
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[85%] rounded-lg px-2.5 py-1.5 shadow-sm sm:max-w-[70%]",
                              highlightId === m.id && "ring-2 ring-primary",
                              m.fromMe ? "chat-outgoing" : "bg-card",
                            )}
                          >
                            {!m.fromMe && m.sender?.name && (
                              <p className="text-[11px] font-semibold text-primary">
                                {m.sender.name}
                              </p>
                            )}
                            {parsed.quote && (
                              <button
                                type="button"
                                onClick={() => parsed.quote?.id && jumpTo(parsed.quote.id)}
                                className="mb-1 block w-full rounded border-l-4 border-primary bg-muted/60 px-2 py-1 text-left text-xs"
                              >
                                <span className="block font-semibold text-primary">
                                  {parsed.quote.sender}
                                </span>
                                <span className="line-clamp-2 text-muted-foreground">
                                  {parsed.quote.snippet}
                                </span>
                              </button>
                            )}
                            {m.mediaUrl && (
                              <MessageMedia
                                message={{
                                  id: m.id,
                                  ticketId: 0,
                                  body: cleanBody,
                                  fromMe: m.fromMe,
                                  createdAt: m.createdAt,
                                  mediaUrl: m.mediaUrl,
                                  mediaType: m.mediaType ?? null,
                                  ticket: { user: m.sender ?? null },
                                }}
                              />
                            )}
                            {!m.mediaUrl && m.mediaName && (
                              <p className="text-xs">{m.mediaName}</p>
                            )}
                            {cleanBody && isVCard(cleanBody) ? (
                              <div className="flex flex-col gap-1.5">
                                {parseVCards(cleanBody).map((contact, i) => (
                                  <ContactCard key={i} contact={contact} />
                                ))}
                              </div>
                            ) : cleanBody && parseLocation(cleanBody) ? (
                              <div className="flex flex-col gap-1.5">
                                <LocationCard
                                  location={parseLocation(cleanBody)!}
                                  label={locationText(cleanBody)}
                                />
                              </div>
                            ) : (
                              cleanBody && <BodyWithMentions body={parsed.body} />
                            )}
                            <p className="mt-0.5 text-right text-[10px] opacity-70">
                              {time(m.createdAt)}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                aria-label={t("messageMenu.label")}
                                title={t("messageMenu.label")}
                                className="shrink-0 rounded-full p-1.5 text-muted-foreground opacity-60 hover:bg-muted hover:text-foreground focus-visible:opacity-100 data-[state=open]:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                              >
                                <MoreVertical className="size-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={m.fromMe ? "end" : "start"}>
                              <DropdownMenuItem onSelect={() => setReplyTo(m)}>
                                <Reply className="size-4" /> {t("reply.action")}
                              </DropdownMenuItem>
                              {cleanBody && (
                                <DropdownMenuItem
                                  onSelect={() => {
                                    void navigator.clipboard
                                      ?.writeText(cleanBody)
                                      .then(() => toast.success(t("messageMenu.copied")));
                                  }}
                                >
                                  <Copy className="size-4" /> {t("messageMenu.copy")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onSelect={() => setForwarding(m)}>
                                <Forward className="size-4" /> {t("forward.action")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => {
                                  setHidden(hideMessageForMe(scopeCompany, scopeUser, m.id));
                                  toast.success(t("messageMenu.deletedForMe"));
                                }}
                              >
                                <Trash2 className="size-4" /> {t("messageMenu.deleteForMe")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </li>
                      </Fragment>
                    );
                  })}
              </ul>
              <div ref={endRef} />
              <ForwardInternalDialog
                message={forwarding}
                currentConversationId={conversation.id}
                companyId={scopeCompany}
                onClose={() => setForwarding(null)}
              />
            </>
          )}
        </QueryBoundary>
      </div>
      <form
        onSubmit={submit}
        {...dropHandlers}
        className={cn(
          "relative shrink-0 border-t bg-card px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4",
          dragging && "bg-primary/10 ring-2 ring-inset ring-primary",
        )}
      >
        {dragging && (
          <p className="pointer-events-none absolute inset-x-0 -top-10 z-10 mx-auto w-fit rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow">
            {t("composer.dropHere")}
          </p>
        )}
        {replyQuote && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border-l-4 border-primary bg-muted/60 p-2 text-xs">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-primary">{replyQuote.sender}</p>
              <p className="truncate text-muted-foreground">{replyQuote.snippet}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("reply.cancel")}
              onClick={() => setReplyTo(null)}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}
        {emojiOpen && (
          <div
            className="mb-2 flex flex-wrap gap-1 rounded-lg border bg-card p-2"
            role="group"
            aria-label={t("composer.emoji")}
          >
            {["😀", "😊", "👍", "❤️", "🙏", "✅", "🎉", "👋"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                disabled={send.isPending}
                className="rounded p-2 text-xl hover:bg-muted"
                aria-label={t("composer.insertEmoji", { emoji })}
                onClick={() => {
                  setText((current) => current + emoji);
                  setEmojiOpen(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        {file && (
          <div className="mb-2 rounded-lg border bg-muted/40 p-2">
            <div className="flex items-center gap-3">
              {previews[active] && file.type.startsWith("image/") ? (
                <button
                  type="button"
                  onClick={() => setImageEditorOpen(true)}
                  aria-label={t("composer.editImage")}
                >
                  <img
                    src={previews[active]}
                    alt={file.name}
                    className="h-24 max-w-40 rounded object-cover sm:h-32"
                  />
                </button>
              ) : previews[active] && file.type.startsWith("video/") ? (
                <video
                  src={previews[active]}
                  controls
                  preload="metadata"
                  className="h-24 max-w-48 rounded bg-foreground sm:h-32"
                />
              ) : previews[active] && file.type.startsWith("audio/") ? (
                <audio controls preload="metadata" src={previews[active]} className="max-w-52" />
              ) : (
                <FileText className="size-8 text-muted-foreground" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                  {files.length > 1 && ` · ${active + 1}/${files.length}`}
                </p>
              </div>
              {file.type.startsWith("image/") && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={t("composer.editImage")}
                  onClick={() => setImageEditorOpen(true)}
                >
                  <Pencil className="size-4" />
                  <span className="hidden sm:inline">{t("composer.editImage")}</span>
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={tt("composer.removeAttachment")}
                onClick={() => removeFile(active)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {files.map((f, index) => (
                <button
                  key={`${f.name}-${f.size}-${index}`}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={f.name}
                  aria-pressed={index === active}
                  className={cn(
                    "flex size-12 shrink-0 items-center justify-center overflow-hidden rounded border-2 bg-background",
                    index === active ? "border-primary" : "border-transparent",
                  )}
                >
                  {f.type.startsWith("image/") && previews[index] ? (
                    <img src={previews[index]} alt="" className="size-full object-cover" />
                  ) : f.type.startsWith("video/") ? (
                    <Video className="size-5 text-muted-foreground" />
                  ) : (
                    <FileText className="size-5 text-muted-foreground" />
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                aria-label={t("composer.addMore")}
                title={t("composer.addMore")}
                className="flex size-12 shrink-0 items-center justify-center rounded border-2 border-dashed text-muted-foreground hover:bg-muted"
              >
                <Plus className="size-5" />
              </button>
            </div>
          </div>
        )}
        {file?.type.startsWith("image/") && (
          <ImageEditorDialog
            file={file}
            open={imageEditorOpen}
            onOpenChange={setImageEditorOpen}
            onSave={replaceActive}
            labels={{
              title: tt("imageEditor.title"),
              rotate: tt("imageEditor.rotate"),
              draw: tt("imageEditor.draw"),
              highlighter: tt("imageEditor.highlighter"),
              arrow: tt("imageEditor.arrow"),
              circle: tt("imageEditor.circle"),
              rectangle: tt("imageEditor.rectangle"),
              text: tt("imageEditor.text"),
              eraser: tt("imageEditor.eraser"),
              blur: tt("imageEditor.blur"),
              crop: tt("imageEditor.crop"),
              color: tt("imageEditor.color"),
              thickness: tt("imageEditor.thickness"),
              textSize: tt("imageEditor.textSize"),
              textPlaceholder: tt("imageEditor.textPlaceholder"),
              undo: tt("imageEditor.undo"),
              redo: tt("imageEditor.redo"),
              restore: tt("imageEditor.restore"),
              canvas: tt("imageEditor.canvas"),
              loading: tt("imageEditor.loading"),
              cancel: tt("imageEditor.cancel"),
              apply: tt("imageEditor.apply"),
            }}
          />
        )}
        <div className="flex items-end gap-1.5">
          <input
            ref={fileInput}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("composer.emoji")}
            aria-pressed={emojiOpen}
            onClick={() => setEmojiOpen((value) => !value)}
          >
            <Smile className="size-4" />
          </Button>
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
            onReady={(f) => send.mutate({ body: "", media: [f] })}
            onError={(reason) => toast.error(tt(`audio.errors.${reason}`))}
          />
          <div className="min-w-0 flex-1">
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
            disabled={send.isPending || (!text.trim() && !files.length)}
            aria-label={t("composer.send")}
          >
            <Send className="size-4" />
          </Button>
        </div>
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
                disabled={k === "queue"}
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
