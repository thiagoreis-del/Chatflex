import { useEffect, useMemo, useRef, useState } from "react";
import { useFallbackInterval, useMessagesRealtime, useTicketsRealtime } from "../realtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRightLeft,
  FileText,
  Lock,
  Paperclip,
  Plus,
  Search,
  Smile,
  Send,
  Tag,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { EmptyState, QueryBoundary } from "@/shared/components";
import { ticketKeys } from "@/shared/api/query-keys";
import { useSession } from "@/shared/auth/session-store";
import { TransferTicketDialog } from "../components/TransferTicketDialog";
import {
  ACCEPTED_MEDIA,
  addTicketTag,
  assignTicket,
  removeTicketTag,
  MAX_MEDIA_BYTES,
  messagesQuery,
  sendMediaMessage,
  sendMessage,
  tagOptionsQuery,
  ticketsContract,
  ticketsQuery,
  updateTicketStatus,
} from "../api";
import type { Message, Ticket, TicketStatus, TicketTag } from "../types";
import { MessageMedia, isImage } from "../components/MessageMedia";
import { quickMessagesQuery } from "@/modules/quick-messages/api";
import {
  QuickMessagePicker,
  filterQuickMessages,
} from "@/modules/quick-messages/components/QuickMessagePicker";

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** Remove a assinatura `*Nome:*\n` enviada ao cliente — o painel já mostra o atendente. */
const stripSignature = (body: string) => body.replace(/^\*[^*\n]+:\*\n?/, "");

export function TicketsPage() {
  const { t } = useTranslation("tickets");
  const [status, setStatus] = useState<TicketStatus>("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const fallback = useFallbackInterval();
  useTicketsRealtime(status);
  const query = useQuery({
    ...ticketsQuery({ status, search: debouncedSearch }),
    refetchInterval: fallback,
  });

  return (
    <div className="tickets-workspace flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg border bg-card shadow-sm">
      <aside
        className={cn(
          "flex min-h-0 min-w-0 w-full flex-col border-r md:w-72 md:shrink-0 xl:w-80",
          selected && "hidden md:flex",
        )}
      >
        <div className="space-y-3 border-b p-3">
          <h1 className="font-display text-lg font-semibold">{t("title")}</h1>
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
              className="pl-8"
            />
          </div>
          <Tabs value={status} onValueChange={(v) => setStatus(v as TicketStatus)}>
            <TabsList className="grid w-full grid-cols-3">
              {(["pending", "open", "closed"] as const).map((s) => (
                <TabsTrigger key={s} value={s} className="text-xs">
                  {t(`tabs.${s}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <QueryBoundary query={query} contract={ticketsContract}>
            {(list) =>
              list.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">{t("empty")}</p>
              ) : (
                <ul>
                  {list.map((tk) => (
                    <li key={tk.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(tk)}
                        className={cn(
                          "flex w-full gap-3 border-b px-3 py-3 text-left transition-colors hover:bg-muted/60",
                          selected?.id === tk.id && "bg-muted",
                        )}
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                          {(tk.contact.name || "#").charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-medium">
                              {tk.contact.name || `+${tk.contact.number}`}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {time(tk.updatedAt)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm text-muted-foreground">
                              {tk.lastMessage}
                            </span>
                            {tk.unreadMessages > 0 && (
                              <span className="rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                                {tk.unreadMessages}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
                            <span
                              className="inline-block rounded px-1.5 text-[11px] font-medium text-primary-foreground"
                              style={{
                                backgroundColor: tk.queue?.color ?? "var(--muted-foreground)",
                              }}
                            >
                              {tk.queue?.name ?? t("noQueue")}
                            </span>
                            <span className="truncate text-[11px] text-muted-foreground">
                              👤 {tk.user?.name ?? t("noAttendant")}
                            </span>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            }
          </QueryBoundary>
        </div>
      </aside>
      <section
        className={cn("flex min-h-0 min-w-0 flex-1 flex-col", !selected && "hidden md:flex")}
      >
        {selected ? (
          <Conversation
            key={selected.id}
            ticket={selected}
            onBack={() => setSelected(null)}
            onChange={setSelected}
          />
        ) : (
          <div className="m-auto">
            <EmptyState title={t("selectTitle")} description={t("selectDescription")} />
          </div>
        )}
      </section>
    </div>
  );
}

function Conversation({
  ticket,
  onBack,
  onChange,
}: {
  ticket: Ticket;
  onBack: () => void;
  onChange: (t: Ticket) => void;
}) {
  const { t } = useTranslation("tickets");
  const { t: tq } = useTranslation("quickMessages");
  const qc = useQueryClient();
  const session = useSession();
  const myId = Number(session.user?.id) || null;
  const msgFallback = useFallbackInterval();
  useMessagesRealtime(ticket.id);
  const messages = useQuery({ ...messagesQuery(ticket.id), refetchInterval: msgFallback });
  const [text, setText] = useState("");
  const [conversationSearch, setConversationSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const quick = useQuery(quickMessagesQuery());
  const slashTerm = /^\/(\S*)$/.exec(text)?.[1];
  const showPicker = pickerOpen || slashTerm !== undefined;
  const pickerTerm = slashTerm ?? "";
  const pickerItems = filterQuickMessages(quick.data ?? [], pickerTerm).slice(0, 8);
  const applyQuick = (message: string) => {
    setText(message);
    setPickerOpen(false);
    setActiveIndex(0);
  };
  const onComposerKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showPicker || pickerItems.length === 0) {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        e.currentTarget.form?.requestSubmit();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % pickerItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + pickerItems.length) % pickerItems.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const m = pickerItems[activeIndex];
      if (m) applyQuick(m.message);
    } else if (e.key === "Escape") {
      setPickerOpen(false);
      if (slashTerm !== undefined) setText("");
    }
  };
  const endRef = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const tagOptions = useQuery({ ...tagOptionsQuery(), enabled: tagOpen });
  const availableTags = (tagOptions.data ?? []).filter(
    (o) => !(ticket.tags ?? []).some((x) => x.id === o.id),
  );
  const tagMutation = useMutation({
    mutationFn: ({ tag, remove }: { tag: TicketTag; remove?: boolean }) =>
      remove ? removeTicketTag(ticket, tag.id) : addTicketTag(ticket, tag),
    onSuccess: (tk) => {
      onChange(tk);
      setTagOpen(false);
      void qc.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onError: () => toast.error(t("toast.tagError")),
  });

  useEffect(() => {
    if (followLatest.current) endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.data?.length]);

  const status = useMutation({
    mutationFn: (s: TicketStatus) => updateTicketStatus(ticket.id, s, myId),
    onSuccess: (tk, s) => {
      toast.success(
        t(
          s === "open"
            ? ticket.status === "closed"
              ? "toast.reopened"
              : "toast.accepted"
            : "toast.closed",
        ),
      );
      onChange(tk);
      void qc.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const preview = useMemo(
    () => (file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const send = useMutation({
    mutationFn: async ({ body, media }: { body: string; media: File | null }) => {
      // Conversa aberta sem responsável: o atendente logado assume antes de responder.
      if (!ticket.user && myId) {
        const tk = await assignTicket(ticket.id, myId);
        onChange({ ...ticket, ...tk, contact: tk?.contact ?? ticket.contact });
      }
      // Assinatura obrigatória: o cliente vê o nome do atendente no WhatsApp.
      // Notas internas nunca são assinadas (não vão ao cliente).
      const myName = session.user?.name?.trim();
      const signed =
        !isPrivate && myName
          ? body
            ? `*${myName}:*\n${body}`
            : media
              ? `*${myName}:*`
              : body
          : body;
      return media
        ? sendMediaMessage(ticket.id, media, signed)
        : sendMessage(ticket.id, signed, isPrivate);
    },
    onSuccess: (message) => {
      followLatest.current = true;
      if (message?.id) {
        qc.setQueryData<Message[]>(ticketKeys.messages(ticket.id), (previous = []) => {
          const existing = previous.findIndex((item) => item.id === message.id);
          if (existing < 0) return [...previous, message];
          return previous.map((item, index) =>
            index === existing ? { ...item, ...message } : item,
          );
        });
      }
      setText("");
      setFile(null);
      void qc.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onError: (_e, v) => toast.error(t(v.media ? "toast.fileError" : "toast.sendError")),
  });

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (f && f.size > MAX_MEDIA_BYTES) {
      toast.error(t("toast.fileTooLarge"));
      return;
    }
    setFile(f);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if ((body || file) && !send.isPending) send.mutate({ body, media: file });
  };

  return (
    <>
      <header className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 border-b px-3 py-2 md:grid-cols-[minmax(0,1fr)_auto] sm:px-4 sm:py-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          onClick={onBack}
          aria-label={t("actions.back")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {ticket.contact.name || `+${ticket.contact.number}`}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            +{ticket.contact.number} ·{" "}
            <span className="font-medium text-foreground">
              {t("attendant")}: {ticket.user?.name ?? t("noAttendant")}
            </span>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {(ticket.tags ?? []).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                  aria-hidden
                />
                {tag.name}
                <button
                  type="button"
                  aria-label={t("tags.remove", { tag: tag.name })}
                  disabled={tagMutation.isPending}
                  onClick={() => tagMutation.mutate({ tag, remove: true })}
                  className="opacity-60 hover:opacity-100"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
            {tagOpen ? (
              <div className="flex flex-wrap items-center gap-1">
                {tagOptions.isLoading && (
                  <span className="text-[11px] text-muted-foreground">{t("tags.loading")}</span>
                )}
                {!tagOptions.isLoading && availableTags.length === 0 && (
                  <span className="text-[11px] text-muted-foreground">{t("tags.none")}</span>
                )}
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    disabled={tagMutation.isPending}
                    onClick={() => tagMutation.mutate({ tag })}
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] hover:bg-accent"
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                      aria-hidden
                    />
                    {tag.name}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label={t("tags.cancel")}
                  onClick={() => setTagOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setTagOpen(true)}
                className="inline-flex items-center gap-0.5 rounded-full border border-dashed px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <Plus className="size-3" aria-hidden />
                {t("tags.add")}
              </button>
            )}
          </div>
        </div>
        <div className="col-span-2 flex shrink-0 items-center justify-end gap-2 md:col-span-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("conversationSearch")}
            aria-pressed={searchOpen}
            onClick={() => {
              setSearchOpen((value) => !value);
              setConversationSearch("");
            }}
          >
            <Search className="size-4" />
          </Button>
          {ticket.status !== "closed" && (
            <Button
              size="sm"
              variant="ghost"
              aria-label={t("actions.transfer")}
              title={t("actions.transfer")}
              onClick={() => setTransferOpen(true)}
            >
              <ArrowRightLeft className="size-4" />
              <span className="hidden sm:inline">{t("actions.transfer")}</span>
            </Button>
          )}
          {ticket.status === "pending" && (
            <Button size="sm" onClick={() => status.mutate("open")} disabled={status.isPending}>
              {t("actions.accept")}
            </Button>
          )}
          {ticket.status === "open" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => status.mutate("closed")}
              disabled={status.isPending}
            >
              {t("actions.close")}
            </Button>
          )}
          {ticket.status === "closed" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => status.mutate("open")}
              disabled={status.isPending}
            >
              {t("actions.reopen")}
            </Button>
          )}
        </div>
      </header>
      {searchOpen && (
        <div className="shrink-0 border-b p-2">
          <Input
            autoFocus
            value={conversationSearch}
            onChange={(event) => setConversationSearch(event.target.value)}
            placeholder={t("conversationSearch")}
            aria-label={t("conversationSearch")}
          />
          <p className="mt-1 text-xs text-muted-foreground">{t("searchLoadedOnly")}</p>
        </div>
      )}
      {transferOpen && (
        <TransferTicketDialog
          ticket={ticket}
          open={transferOpen}
          onOpenChange={setTransferOpen}
          onDone={onChange}
        />
      )}
      <div
        onScroll={(event) => {
          const pane = event.currentTarget;
          followLatest.current = pane.scrollHeight - pane.scrollTop - pane.clientHeight < 100;
        }}
        className="chat-messages min-h-0 min-w-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3 sm:p-4"
      >
        <QueryBoundary query={messages} contract="GET /messages/:ticketId">
          {(list) => (
            <>
              {list
                .filter(
                  (m) =>
                    !conversationSearch ||
                    m.body.toLocaleLowerCase().includes(conversationSearch.toLocaleLowerCase()),
                )
                .map((m) => (
                  <div
                    key={m.id}
                    className={cn("flex min-w-0", m.fromMe ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "min-w-0 max-w-[90%] rounded-lg px-3 py-2 text-sm shadow-sm sm:max-w-[75%]",
                        m.isPrivate
                          ? "rounded-br-sm border border-dashed border-warning bg-warning/15 text-foreground"
                          : m.fromMe
                            ? "chat-outgoing rounded-br-sm"
                            : "rounded-bl-sm bg-card",
                      )}
                    >
                      {m.isPrivate && (
                        <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          <Lock className="size-3" aria-hidden />
                          {t("privateBadge")}
                        </p>
                      )}
                      {(m.fromMe || m.isPrivate) && (m.ticket?.user?.name ?? ticket.user?.name) && (
                        <p
                          className={cn(
                            "mb-1 truncate text-xs font-semibold",
                            m.fromMe && !m.isPrivate ? "text-foreground/80" : "text-foreground/80",
                          )}
                        >
                          {m.ticket?.user?.name ?? ticket.user?.name}
                        </p>
                      )}
                      <MessageMedia message={m} />
                      {!(m.mediaUrl && !isImage(m)) && m.body && (
                        <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                          {m.fromMe && !m.isPrivate ? stripSignature(m.body) : m.body}
                        </p>
                      )}
                      <p
                        className={cn(
                          "mt-1 text-right text-[10px]",
                          m.fromMe && !m.isPrivate
                            ? "text-muted-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {time(m.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              <div ref={endRef} />
            </>
          )}
        </QueryBoundary>
      </div>
      {ticket.status === "open" ? (
        <form onSubmit={submit} className="relative min-w-0 shrink-0 border-t p-2 sm:p-3">
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
            <div className="mb-2 flex items-center gap-3 rounded-lg border bg-muted/40 p-2">
              {preview ? (
                <img src={preview} alt={file.name} className="size-14 rounded object-cover" />
              ) : (
                <FileText className="size-8 text-muted-foreground" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("composer.removeAttachment")}
                onClick={() => setFile(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
          )}
          <div className="grid grid-cols-[auto_auto_auto_auto_minmax(0,1fr)_auto] items-center gap-1 sm:gap-2 [&>button]:size-8 sm:[&>button]:size-10">
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
            {showPicker && (
              <QuickMessagePicker
                term={pickerTerm}
                activeIndex={activeIndex}
                onPick={(m) => applyQuick(m.message)}
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={send.isPending}
              aria-label={tq("picker.open")}
              title={tq("picker.hint")}
              onClick={() => setPickerOpen((o) => !o)}
            >
              <Zap className="size-4" />
            </Button>
            <Button
              type="button"
              disabled={send.isPending}
              variant={isPrivate ? "secondary" : "ghost"}
              size="icon"
              aria-label={t("composer.privateNote")}
              aria-pressed={isPrivate}
              title={t("composer.privateNote")}
              onClick={() => {
                setIsPrivate((v) => !v);
                setFile(null);
              }}
            >
              <Lock className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isPrivate || send.isPending}
              aria-label={t("composer.attach")}
              title={t("composer.attach")}
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip className="size-4" />
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED_MEDIA}
              className="hidden"
              onChange={pickFile}
            />
            <textarea
              rows={2}
              disabled={send.isPending}
              value={text}
              className="min-w-0 w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onKeyDown={onComposerKey}
              onBlur={() => setPickerOpen(false)}
              onChange={(e) => {
                setText(e.target.value);
                setActiveIndex(0);
              }}
              placeholder={t(
                isPrivate
                  ? "composer.privatePlaceholder"
                  : file
                    ? "composer.caption"
                    : "composer.placeholder",
              )}
              aria-label={t("composer.placeholder")}
            />
            <Button
              type="submit"
              disabled={(!text.trim() && !file) || send.isPending}
              aria-label={t("composer.send")}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </form>
      ) : (
        <p className="shrink-0 border-t p-3 text-center text-sm text-muted-foreground [overflow-wrap:anywhere]">
          {t("composer.acceptFirst")}
        </p>
      )}
    </>
  );
}
