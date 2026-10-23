import { useEffect, useMemo, useRef, useState } from "react";
import { useFallbackInterval, useMessagesRealtime, useTicketsRealtime } from "../realtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRightLeft,
  Camera,
  Clock,
  Inbox,
  MessageCircle,
  MoreVertical,
  RefreshCw,
  SearchX,
  SlidersHorizontal,
  Smartphone,
  UserRound,
  Users,
  XCircle,
  FileText,
  Image as ImageIcon,
  Lock,
  Paperclip,
  Pencil,
  Plus,
  Reply,
  Search,
  Smile,
  Undo2,
  Send,
  Tag,
  Video,
  X,
  Zap,
  Bell,
  BellOff,
  Contact as ContactIcon,
} from "lucide-react";
import { mutedKey, setMuted, useMutedContacts } from "../muted-contacts";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { attendantBadgeColor } from "@/shared/attendant-color";
import { EmptyState, QueryBoundary } from "@/shared/components";
import { ticketKeys } from "@/shared/api/query-keys";
import { ApiError } from "@/shared/api/errors";
import { useSession } from "@/shared/auth/session-store";
import { TransferTicketDialog } from "../components/TransferTicketDialog";
import { hideRefusedTicket, restoreRefusedTicket, useRefusedHiddenIds } from "../refused";
import {
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
  groupTicketsQuery,
  closeTicketsBulk,
  transferTicket,
  updateTicketStatus,
} from "../api";
import type { Message, Ticket, TicketStatus, TicketTab, TicketTag } from "../types";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { allCompanyUsersQuery } from "@/modules/users/api";
import { matchesAttendantFilter, selectedReplyUserId } from "../attendant-selection";
import { ContactFormDialog } from "@/modules/contacts/components/ContactFormDialog";
import { getContact } from "@/modules/contacts/api";
import type { Contact } from "@/modules/contacts/types";
import { contactKeys } from "@/shared/api/query-keys";
import { MessageMedia } from "../components/MessageMedia";
import { ContactCard } from "../components/ContactCard";
import { LocationCard } from "../components/LocationCard";
import { isVCard, parseVCards } from "../vcard";
import { parseLocation, locationText } from "../location";
import { NewTicketSuggestions } from "../components/NewTicketSuggestions";
import { AudioRecorder } from "../components/AudioRecorder";
import { ShareContactDialog, contactCardText } from "../components/ShareContactDialog";
import { isDangerousFile } from "../audio-format";
import { ImageEditorDialog } from "../components/ImageEditorDialog";
import { CloseTicketDialog } from "../components/CloseTicketDialog";
import { useConnectivity } from "@/shared/connectivity/connectivity";
import { closingMessageQuery } from "@/modules/settings/closing-message";
import { computeSla, slaConfigQuery, type SlaState } from "@/modules/sla/sla";
import { SlaBadge } from "@/modules/sla/components/SlaBadge";
import { quickMessagesQuery } from "@/modules/quick-messages/api";
import {
  QuickMessagePicker,
  filterQuickMessages,
} from "@/modules/quick-messages/components/QuickMessagePicker";
import {
  clearDraft,
  enqueueOutbox,
  listOutbox,
  loadDraft,
  removeFromOutbox,
  saveDraft,
} from "../offline-outbox";

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** Identidade visual das quatro categorias de atendimento. */
const TAB_ICONS: Record<TicketTab, typeof Inbox> = {
  open: MessageCircle,
  pending: Clock,
  groups: Users,
  closed: Inbox,
};
const TAB_ACTIVE_CLASSES: Record<TicketTab, string> = {
  open: "bg-success text-success-foreground shadow-md ring-2 ring-success/30",
  pending: "bg-destructive text-destructive-foreground shadow-md ring-2 ring-destructive/30",
  groups: "bg-groups text-groups-foreground shadow-md ring-2 ring-groups/30",
  closed: "bg-muted-foreground/20 text-foreground shadow-md ring-2 ring-muted-foreground/20",
};
const TAB_IDLE_CLASSES: Record<TicketTab, string> = {
  open: "bg-success/10 text-success hover:bg-success/20",
  pending: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  groups: "bg-groups/10 text-groups hover:bg-groups/15",
  closed: "bg-muted/60 text-muted-foreground hover:bg-muted",
};

/** Remove a assinatura `*Nome:*\n` enviada ao cliente — o painel já mostra o atendente. */
const stripSignature = (body: string) => body.replace(/^\*[^*\n]+:\*\n?/, "");
/** Texto visível na bolha: remove a assinatura "*Nome:*" das mensagens enviadas. */
const displayBody = (m: Pick<Message, "body" | "fromMe" | "isPrivate">) =>
  m.fromMe && !m.isPrivate ? stripSignature(m.body) : m.body;

export function TicketsPage() {
  const { t } = useTranslation("tickets");
  const [tab, setTab] = useState<TicketTab>("open");
  const status: TicketStatus = tab === "groups" ? "open" : tab;
  const session = useSession();
  const mutedIds = useMutedContacts(
    session.user ? mutedKey(session.user.companyId, session.user.id) : null,
  );
  const qcl = useQueryClient();
  const isAdmin = session.user?.role === "superadmin" || session.user?.role === "company_admin";
  const [confirmClose, setConfirmClose] = useState(false);
  const [search, setSearch] = useState("");
  const [connectionId, setConnectionId] = useState("all");
  const [slaFilter, setSlaFilter] = useState<"all" | SlaState>("all");
  const { t: ts } = useTranslation("settings");
  const sla = useQuery(slaConfigQuery(String(session.user?.companyId ?? ""))).data;
  const slaOn = !!sla?.enabled && tab !== "closed" && tab !== "groups";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!slaOn) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [slaOn]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const hiddenRefused = useRefusedHiddenIds(String(session.user?.id ?? ""));
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const fallback = useFallbackInterval();
  useTicketsRealtime(status);
  const listOpts =
    tab === "groups"
      ? groupTicketsQuery(debouncedSearch)
      : {
          ...ticketsQuery({ status, search: debouncedSearch }),
          select: (l: Ticket[]) =>
            l.filter((x) => !x.contact?.isGroup && !x.isGroup && !hiddenRefused.has(x.id)),
        };
  const query = useQuery({
    ...(listOpts as ReturnType<typeof groupTicketsQuery>),
    refetchInterval: fallback,
    // Continua atualizando com a aba em segundo plano (atendente em outra janela).
    refetchIntervalInBackground: true,
  });
  const closeable = (query.data ?? []).filter(
    (x) =>
      x.status !== "closed" && (connectionId === "all" || String(x.whatsapp?.id) === connectionId),
  );
  const [showFilters, setShowFilters] = useState(false);
  const [attendantFilter, setAttendantFilter] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const activeFilters =
    (connectionId !== "all" ? 1 : 0) +
    (attendantFilter !== "all" ? 1 : 0) +
    (unreadOnly ? 1 : 0) +
    (slaOn && slaFilter !== "all" ? 1 : 0);
  const clearFilters = () => {
    setConnectionId("all");
    setAttendantFilter("all");
    setUnreadOnly(false);
    setSlaFilter("all");
  };
  // Recusar encerra o atendimento (não volta para a fila) e o tira da lista do atendente.
  const refuseFromList = useMutation({
    mutationFn: (tk: Ticket) => {
      hideRefusedTicket(String(session.user?.id ?? ""), tk.id);
      return updateTicketStatus(tk.id, "closed");
    },
    onSuccess: (tk) => {
      toast.success(t("toast.refused"));
      if (selected?.id === tk.id) setSelected(null);
      void qcl.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onError: (_e, tk) => {
      restoreRefusedTicket(String(session.user?.id ?? ""), tk.id);
      toast.error(t("toast.transferError"));
    },
  });
  const connections = Array.from(
    new Map(
      (query.data ?? []).filter((x) => x.whatsapp).map((x) => [x.whatsapp!.id, x.whatsapp!]),
    ).values(),
  );
  const companyUsers = useQuery({ ...allCompanyUsersQuery(), enabled: isAdmin });
  /** Admin vê todos os atendentes da empresa; os demais não escolhem colegas. */
  const attendants = isAdmin
    ? Array.from(
        new Map(
          [
            ...(companyUsers.data ?? []).map((u) => ({ id: u.id, name: u.name })),
            ...(query.data ?? []).filter((x) => x.user).map((x) => x.user!),
          ].map((u) => [String(u.id), u]),
        ).values(),
      ).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    : [];
  const matchesFilters = (x: Ticket) =>
    (connectionId === "all" || String(x.whatsapp?.id) === connectionId) &&
    matchesAttendantFilter(x, attendantFilter, session.user?.id, isAdmin) &&
    (!unreadOnly || x.unreadMessages > 0) &&
    (!slaOn || slaFilter === "all" || computeSla(x, sla!, now).state === slaFilter);
  const notGroup = (l: Ticket[]) =>
    l.filter((x) => !x.contact?.isGroup && !x.isGroup && !hiddenRefused.has(x.id));
  const openCount = useQuery({
    ...ticketsQuery({ status: "open", search: debouncedSearch }),
    select: (l: Ticket[]) => notGroup(l).length,
    refetchInterval: fallback,
  }).data;
  const pendingCount = useQuery({
    ...ticketsQuery({ status: "pending", search: debouncedSearch }),
    select: (l: Ticket[]) => notGroup(l).length,
    refetchInterval: fallback,
  }).data;
  const groupsCount = useQuery({
    ...groupTicketsQuery(debouncedSearch),
    select: (l: Ticket[]) => l.filter((x) => !hiddenRefused.has(x.id)).length,
    refetchInterval: fallback,
  }).data;
  const activeIdsOf = (l: Ticket[]) => l.map((x) => x.contact?.id);
  const openIds = useQuery({
    ...ticketsQuery({ status: "open", search: debouncedSearch }),
    select: activeIdsOf,
  }).data;
  const pendingIds = useQuery({
    ...ticketsQuery({ status: "pending", search: debouncedSearch }),
    select: activeIdsOf,
  }).data;
  const activeContactIds = useMemo(
    () => new Set([...(openIds ?? []), ...(pendingIds ?? [])]),
    [openIds, pendingIds],
  );
  const counts: Partial<Record<TicketTab, number | undefined>> = {
    open: openCount,
    pending: pendingCount,
    groups: groupsCount,
  };
  const bulkClose = useMutation({
    mutationFn: () => closeTicketsBulk(closeable.map((x) => x.id)),
    onSuccess: (r) => {
      if (r.closed) toast.success(t("closeAll.done", { count: r.closed }));
      if (r.failed) toast.error(t("closeAll.partial", { count: r.failed }));
      setSelected(null);
      qcl.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });

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
            <h1 className="font-display text-lg font-semibold tracking-tight">
              {t("sidebar.title")}
            </h1>
            <div className="flex items-center gap-1">
              <Button
                variant={showFilters || activeFilters > 0 ? "secondary" : "ghost"}
                size="icon"
                className="relative size-8"
                aria-label={t("sidebar.filters")}
                aria-pressed={showFilters}
                onClick={() => setShowFilters((v) => !v)}
              >
                <SlidersHorizontal className="size-4" />
                {activeFilters > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {activeFilters}
                  </span>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label={t("sidebar.actions")}
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onSelect={() => qcl.invalidateQueries({ queryKey: ticketKeys.all })}
                  >
                    <RefreshCw className="mr-2 size-4" /> {t("sidebar.refresh")}
                  </DropdownMenuItem>
                  {isAdmin && tab !== "closed" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        disabled={closeable.length === 0 || bulkClose.isPending}
                        onSelect={() => setConfirmClose(true)}
                      >
                        <XCircle className="mr-2 size-4" /> {t("closeAll.button")} (
                        {closeable.length})
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                aria-label={t("sidebar.clearSearch")}
                className="absolute right-2 top-2 rounded-full p-0.5 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as TicketTab)}>
            <TabsList className="grid h-auto w-full grid-cols-4 gap-1 bg-transparent p-0">
              {(["open", "pending", "groups", "closed"] as const).map((s) => {
                const c = s === tab ? query.data?.length : counts[s];
                const Icon = TAB_ICONS[s];
                const active = s === tab;
                return (
                  <TabsTrigger
                    key={s}
                    value={s}
                    className={cn(
                      "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border-0 px-1 py-2",
                      "text-[11px] font-semibold leading-tight transition-all sm:text-xs",
                      active ? TAB_ACTIVE_CLASSES[s] : TAB_IDLE_CLASSES[s],
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <Icon className="size-4 shrink-0 sm:size-5" aria-hidden />
                      {s !== "closed" && (
                        <span
                          className={cn(
                            "min-w-7 rounded-full px-1.5 text-sm font-extrabold leading-6 tabular-nums sm:text-base",
                            active
                              ? "bg-background text-foreground shadow-sm"
                              : "bg-background text-current shadow-sm ring-1 ring-current/20",
                          )}
                          aria-label={String(c ?? 0)}
                        >
                          {c === undefined ? "–" : c > 99 ? "99+" : c}
                        </span>
                      )}
                    </span>
                    <span className="max-w-full truncate">{t(`tabs.${s}`)}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          {showFilters && (
            <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-2">
              {connections.length > 0 && (
                <select
                  value={connectionId}
                  onChange={(e) => setConnectionId(e.target.value)}
                  aria-label={t("connectionFilter")}
                  className="col-span-2 h-8 rounded-md border bg-background px-2 text-xs"
                >
                  <option value="all">{t("allConnections")}</option>
                  {connections.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                      {c.number ? ` · +${c.number}` : ""}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={attendantFilter}
                onChange={(e) => setAttendantFilter(e.target.value)}
                aria-label={t("attendant")}
                className="h-8 rounded-md border bg-background px-2 text-xs"
              >
                <option value="all">{t("sidebar.allAttendants")}</option>
                <option value="mine">{t("sidebar.mine")}</option>
                <option value="none">{t("sidebar.unassigned")}</option>
                {attendants.length > 0 && (
                  <optgroup label={t("sidebar.attendantsGroup")}>
                    {attendants.map((u) => (
                      <option key={u.id} value={String(u.id)}>
                        {u.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              {slaOn ? (
                <select
                  value={slaFilter}
                  onChange={(e) => setSlaFilter(e.target.value as "all" | SlaState)}
                  aria-label={ts("sla.filter")}
                  className="h-8 rounded-md border bg-background px-2 text-xs"
                >
                  <option value="all">{ts("sla.filterAll")}</option>
                  {(["monitoring", "warning", "urgent", "violated"] as const).map((s) => (
                    <option key={s} value={s}>
                      {ts(`sla.states.${s}`)}
                    </option>
                  ))}
                </select>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => setUnreadOnly((v) => !v)}
                aria-pressed={unreadOnly}
                className={cn(
                  "inline-flex h-7 items-center justify-center gap-1 rounded-full border px-2 text-xs font-medium transition-colors",
                  unreadOnly ? "border-primary bg-primary/10 text-primary" : "bg-background",
                )}
              >
                <MessageCircle className="size-3.5" /> {t("sidebar.unreadOnly")}
              </button>
              {activeFilters > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-7 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {t("sidebar.clearFilters")}
                </button>
              )}
            </div>
          )}
          <ConfirmDialog
            open={confirmClose}
            onOpenChange={setConfirmClose}
            title={t("closeAll.title")}
            description={t("closeAll.description", { count: closeable.length })}
            confirmLabel={t("closeAll.confirm")}
            onConfirm={() => {
              setConfirmClose(false);
              if (isAdmin) bulkClose.mutate();
            }}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {tab !== "groups" && openIds && pendingIds && (
            <NewTicketSuggestions
              search={debouncedSearch}
              activeContactIds={activeContactIds}
              userId={session.user?.id ? Number(session.user.id) : undefined}
              onStarted={(tk) => {
                setTab("open");
                setSearch("");
                setSelected(tk);
              }}
            />
          )}
          {query.isPending ? (
            <ul aria-busy className="divide-y">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i} className="flex gap-3 px-3 py-3">
                  <Skeleton className="size-11 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <QueryBoundary query={query} contract={ticketsContract}>
              {(list) => {
                const visible = list.filter((x) => !hiddenRefused.has(x.id) && matchesFilters(x));
                if (visible.length === 0) {
                  const msg = debouncedSearch
                    ? t("sidebar.noResults", { q: debouncedSearch })
                    : activeFilters > 0
                      ? t("sidebar.noFiltered")
                      : t("empty");
                  return (
                    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-sm text-muted-foreground">
                      {debouncedSearch ? (
                        <SearchX className="size-8" />
                      ) : (
                        <Inbox className="size-8" />
                      )}
                      <p>{msg}</p>
                      {(debouncedSearch || activeFilters > 0) && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => {
                            setSearch("");
                            clearFilters();
                          }}
                        >
                          {t("sidebar.clearFilters")}
                        </Button>
                      )}
                    </div>
                  );
                }
                return (
                  <ul className="divide-y divide-border/60">
                    {visible.map((tk) => {
                      const slaInfo = slaOn ? computeSla(tk, sla!, now) : null;
                      const hl = sla?.highlight ? slaInfo?.state : undefined;
                      const isSel = selected?.id === tk.id;
                      const name = tk.contact.name || `+${tk.contact.number}`;
                      const preview = stripSignature(tk.lastMessage ?? "");
                      const waitMin =
                        tk.status === "pending"
                          ? Math.max(
                              0,
                              Math.floor((now - new Date(tk.updatedAt).getTime()) / 60000),
                            )
                          : 0;
                      return (
                        <li key={tk.id}>
                          <button
                            type="button"
                            onClick={() => setSelected(tk)}
                            aria-current={isSel || undefined}
                            className={cn(
                              "flex w-full gap-3 border-l-[3px] border-l-transparent px-3 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none",
                              hl === "urgent" && "border-l-warning bg-warning/5",
                              hl === "violated" && "border-l-destructive bg-destructive/5",
                              isSel && "border-l-primary bg-primary/10 hover:bg-primary/10",
                            )}
                          >
                            <div className="relative shrink-0">
                              <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-primary/5 font-display text-base font-semibold uppercase text-primary">
                                {tk.contact.isGroup || tk.isGroup ? (
                                  <Users className="size-5" />
                                ) : (
                                  name.replace(/^\+/, "").charAt(0) || "#"
                                )}
                              </div>
                              <span
                                className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-card bg-success text-success-foreground"
                                title={tk.whatsapp?.name ?? t("unknownOrigin")}
                              >
                                <MessageCircle className="size-2" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <span
                                  className={cn(
                                    "truncate text-sm",
                                    tk.unreadMessages > 0 ? "font-semibold" : "font-medium",
                                  )}
                                >
                                  {name}
                                  {mutedIds.includes(tk.contact.id) && (
                                    <BellOff
                                      className="ml-1 inline size-3 text-muted-foreground"
                                      aria-label={t("mute.muted")}
                                    />
                                  )}
                                </span>
                                <span
                                  className={cn(
                                    "shrink-0 text-[11px]",
                                    tk.unreadMessages > 0
                                      ? "font-semibold text-primary"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {time(tk.updatedAt)}
                                </span>
                              </div>
                              <div className="mt-0.5 flex items-center justify-between gap-2">
                                <span
                                  className={cn(
                                    "truncate text-[13px]",
                                    tk.unreadMessages > 0
                                      ? "text-foreground"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {preview || "\u00a0"}
                                </span>
                                {tk.unreadMessages > 0 && (
                                  <span
                                    className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground"
                                    aria-label={t("sidebar.unread", { count: tk.unreadMessages })}
                                  >
                                    {tk.unreadMessages > 99 ? "99+" : tk.unreadMessages}
                                  </span>
                                )}
                              </div>
                              <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1">
                                {slaInfo && <SlaBadge info={slaInfo} />}
                                <span className="inline-flex max-w-[45%] items-center gap-1 truncate rounded-md border px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                                  <span
                                    className="size-1.5 shrink-0 rounded-full"
                                    style={{
                                      backgroundColor: tk.queue?.color ?? "var(--muted-foreground)",
                                    }}
                                  />
                                  <span className="truncate">{tk.queue?.name ?? t("noQueue")}</span>
                                </span>
                                <span className="inline-flex max-w-[45%] items-center gap-1 truncate rounded-md bg-muted px-1.5 py-px text-[10px] text-muted-foreground">
                                  <Smartphone className="size-2.5 shrink-0" />
                                  <span className="truncate">
                                    {tk.whatsapp?.name ?? t("unknownOrigin")}
                                  </span>
                                </span>
                                {waitMin > 0 && (
                                  <span className="inline-flex items-center gap-0.5 rounded-md bg-warning/15 px-1.5 py-px text-[10px] font-medium text-foreground">
                                    <Clock className="size-2.5" />
                                    {waitMin >= 60
                                      ? `${Math.floor(waitMin / 60)}h${waitMin % 60}m`
                                      : `${waitMin}m`}
                                  </span>
                                )}
                                {tk.user ? (
                                  <span
                                    title={t("attendant") + ": " + tk.user.name}
                                    className={cn(
                                      "ml-auto inline-flex max-w-[45%] items-center gap-1 truncate rounded-md border px-1.5 py-px text-[10px] font-semibold",
                                      attendantBadgeColor(tk.user).badge,
                                    )}
                                  >
                                    <UserRound className="size-2.5 shrink-0" />
                                    <span className="truncate">{tk.user.name}</span>
                                  </span>
                                ) : (
                                  <span
                                    title={t("noAttendant")}
                                    className="ml-auto inline-flex items-center gap-1 truncate rounded-md border border-warning/40 bg-warning/10 px-1.5 py-px text-[10px] font-semibold text-warning-foreground"
                                  >
                                    <UserRound className="size-2.5 shrink-0" />
                                    <span className="truncate">{t("noAttendant")}</span>
                                  </span>
                                )}
                                {tk.status !== "closed" && (
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    aria-label={t("actions.refuse")}
                                    title={t("actions.refuse")}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      refuseFromList.mutate(tk);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        refuseFromList.mutate(tk);
                                      }
                                    }}
                                    className="inline-flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive/40"
                                  >
                                    <Undo2 className="size-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                );
              }}
            </QueryBoundary>
          )}
        </div>
      </aside>
      <section
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col",
          selected ? "chat-open" : "hidden md:flex",
        )}
      >
        {selected ? (
          <Conversation
            key={selected.id}
            ticket={selected}
            defaultReplyAsId={selectedReplyUserId(attendantFilter, isAdmin)}
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
  defaultReplyAsId,
  onBack,
  onChange,
}: {
  ticket: Ticket;
  defaultReplyAsId: number | null;
  onBack: () => void;
  onChange: (t: Ticket | null) => void;
}) {
  const { t } = useTranslation("tickets");
  const { t: tq } = useTranslation("quickMessages");
  const qc = useQueryClient();
  const session = useSession();
  const muteKey = session.user ? mutedKey(session.user.companyId, session.user.id) : null;
  const muted = useMutedContacts(muteKey).includes(ticket.contact.id);
  const isAdmin = session.user?.role === "superadmin" || session.user?.role === "company_admin";
  const myId = Number(session.user?.id) || null;
  // Admin pode responder em nome de qualquer usuário da empresa.
  const companyUsers = useQuery({ ...allCompanyUsersQuery(), enabled: isAdmin });
  const [replyAsId, setReplyAsId] = useState<number | null>(defaultReplyAsId);
  useEffect(() => setReplyAsId(defaultReplyAsId), [defaultReplyAsId]);
  const replyAs =
    isAdmin && replyAsId ? companyUsers.data?.find((u) => u.id === replyAsId) : undefined;
  const senderId = replyAs?.id ?? myId;
  const senderName = (replyAs?.name ?? session.user?.name)?.trim();
  const msgFallback = useFallbackInterval();
  useMessagesRealtime(ticket.id);
  const messages = useQuery({
    ...messagesQuery(ticket.id),
    refetchInterval: msgFallback,
    refetchIntervalInBackground: true,
  });
  const companyId = String(session.user?.companyId ?? "");
  const [text, setText] = useState(() => loadDraft(companyId, ticket.id));
  // Rascunho preservado por conversa (sobrevive a queda de conexão/recarga).
  useEffect(() => {
    const id = setTimeout(() => saveDraft(companyId, ticket.id, text), 400);
    return () => clearTimeout(id);
  }, [companyId, ticket.id, text]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const openContactEditor = async () => {
    const base: Contact = {
      id: ticket.contact.id,
      name: ticket.contact.name,
      number: ticket.contact.number,
    };
    try {
      setEditingContact({ ...base, ...(await getContact(ticket.contact.id)) });
    } catch {
      setEditingContact(base);
    }
  };
  const [highlightId, setHighlightId] = useState<string | null>(null);
  useEffect(() => setReplyTo(null), [ticket.id]);
  const jumpTo = (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (!el) {
      toast.info(t("reply.notLoaded"));
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightId(id);
    window.setTimeout(() => setHighlightId((cur) => (cur === id ? null : cur)), 1800);
  };
  const quoteLabel = (m: Partial<Message>) => {
    const body = m.fromMe && m.body ? stripSignature(m.body) : m.body;
    if (body && isVCard(body)) return t("reply.contact");
    if (body && parseLocation(body)) return t("reply.location");
    if (body && !(m.mediaUrl && !m.mediaType?.startsWith("image"))) return body;
    const kind = m.mediaType?.split("/")[0];
    if (kind === "image") return t("reply.image");
    if (kind === "video") return t("reply.video");
    if (kind === "audio") return t("reply.audio");
    return body || t("reply.document");
  };
  const [conversationSearch, setConversationSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const quick = useQuery(quickMessagesQuery(session.user?.companyId));
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

  const [closeOpen, setCloseOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const shareContact = useMutation({
    mutationFn: (c: Contact) => {
      const card = contactCardText(c);
      return sendMessage(ticket.id, senderName ? `*${senderName}:*\n${card}` : card);
    },
    onSuccess: () => {
      toast.success(t("toast.contactShared"));
      void qc.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onError: () => toast.error(t("toast.sendError")),
  });
  const closeWithMessage = useMutation({
    mutationFn: async (msg: string | null) => {
      if (msg) {
        const name = senderName;
        await sendMessage(ticket.id, name ? `*${name}:*\n${msg}` : msg);
      }
      return updateTicketStatus(ticket.id, "closed", myId);
    },
    onSuccess: (tk) => {
      toast.success(t("toast.closed"));
      setCloseOpen(false);
      onChange(tk);
      void qc.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onError: () => toast.error(t("closing.error")),
  });
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
  // Recusar encerra o atendimento (não volta para a fila) e o tira da lista do atendente.
  const refuse = useMutation({
    mutationFn: () => {
      hideRefusedTicket(String(session.user?.id ?? ""), ticket.id);
      return updateTicketStatus(ticket.id, "closed");
    },
    onSuccess: () => {
      toast.success(t("toast.refused"));
      onChange(null);
      void qc.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onError: () => {
      restoreRefusedTicket(String(session.user?.id ?? ""), ticket.id);
      toast.error(t("toast.transferError"));
    },
  });
  const [files, setFiles] = useState<File[]>([]);
  const [active, setActive] = useState(0);
  const file = files[active] ?? null;
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [upload, setUpload] = useState<{ index: number; total: number; percent: number } | null>(
    null,
  );
  const uploadAbort = useRef<AbortController | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const urls = useMemo(
    () =>
      files.map((f) =>
        f.type.startsWith("image/") || f.type.startsWith("video/") || f.type.startsWith("audio/")
          ? URL.createObjectURL(f)
          : null,
      ),
    [files],
  );
  useEffect(() => () => urls.forEach((u) => u && URL.revokeObjectURL(u)), [urls]);
  const thumbs = files.map((f, i) => (f.type.startsWith("image/") ? urls[i] : null));
  const preview = file?.type.startsWith("image/") ? urls[active] : null;
  const videoPreview = file?.type.startsWith("video/") ? urls[active] : null;
  const audioPreview = file?.type.startsWith("audio/") ? urls[active] : null;

  const send = useMutation({
    mutationFn: async ({
      body,
      media,
      keepComposer,
    }: {
      body: string;
      media: File[];
      /** Envio direto de áudio: não limpa o texto digitado nem o rascunho salvo. */
      keepComposer?: boolean;
    }) => {
      // Conversa aberta sem responsável: o atendente logado assume antes de responder.
      // Admin respondendo como outro usuário: o ticket passa para esse usuário.
      if (senderId && (!ticket.user || (replyAs && ticket.user.id !== senderId))) {
        const tk = await assignTicket(ticket.id, senderId);
        onChange({ ...ticket, ...tk, contact: tk?.contact ?? ticket.contact });
      }
      // Mensagens de texto e anexos recebem assinatura do atendente.
      // Áudio não recebe legenda porque mensagens de voz podem rejeitar caption.
      // Notas internas nunca são assinadas (não vão ao cliente).
      const myName = senderName;
      const signFor = (text: string, item: File | null) => {
        const isAudio = item?.type.startsWith("audio/");
        if (isPrivate || !myName || isAudio) return text;
        if (text) return `*${myName}:*\n${text}`;
        return item ? `*${myName}:*` : text;
      };
      const add = (message: Message | undefined) => {
        if (!message?.id) return;
        qc.setQueryData<Message[]>(ticketKeys.messages(ticket.id), (previous = []) => {
          const existing = previous.findIndex((item) => item.id === message.id);
          if (existing < 0) return [...previous, message];
          return previous.map((item, index) =>
            index === existing ? { ...item, ...message } : item,
          );
        });
      };
      if (!media.length) {
        add(
          await sendMessage(ticket.id, signFor(body, null), isPrivate, isPrivate ? null : replyTo),
        );
        return;
      }
      // Envia um arquivo por vez; legenda vai só no primeiro (como no WhatsApp).
      const controller = new AbortController();
      uploadAbort.current = controller;
      for (let i = 0; i < media.length; i++) {
        const item = media[i]!;
        setUpload({ index: i, total: media.length, percent: 0 });
        try {
          add(
            await sendMediaMessage(ticket.id, item, signFor(i === 0 ? body : "", item), {
              signal: controller.signal,
              onProgress: (f) =>
                setUpload({ index: i, total: media.length, percent: Math.round(f * 100) }),
            }),
          );
        } catch (error) {
          setUpload(null);
          // Mantém os arquivos que faltaram para o atendente tentar de novo.
          // Áudio enviado direto não entra na caixa de anexos (há texto digitado).
          if (!keepComposer) {
            setFiles(media.slice(i));
            setActive(0);
            if (i > 0) setText("");
          }
          throw error;
        }
      }
      setUpload(null);
    },
    onSuccess: (_data, v) => {
      followLatest.current = true;
      // Áudio enviado direto: preserva o texto digitado, o rascunho e a resposta citada.
      if (!v.keepComposer) {
        setReplyTo(null);
        setText("");
      }
      // O cursor volta para o campo de mensagem logo após o envio.
      // O campo fica desabilitado durante o envio; tenta de novo se ainda estiver.
      const refocus = (attempt = 0) => {
        requestAnimationFrame(() => {
          const input = inputRef.current;
          if (!input) return;
          input.focus();
          if (document.activeElement !== input && attempt < 5)
            setTimeout(() => refocus(attempt + 1), 50);
        });
      };
      refocus();
      if (!v.keepComposer) {
        clearDraft(companyId, ticket.id);
        setFiles([]);
        setActive(0);
      }
      void qc.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onError: (e, v) => {
      if (e instanceof ApiError && e.kind === "aborted") {
        toast.info(t("toast.uploadCanceled"));
        return;
      }
      // Falha real de rede e só texto: entra na fila e é reenviado ao reconectar
      // (não depende de navigator.onLine, que dá falso negativo).
      if (!v.media.length && v.body.trim() && e instanceof ApiError && e.kind === "network") {
        enqueueOutbox(companyId, { ticketId: ticket.id, body: v.body, isPrivate });
        setText("");
        clearDraft(companyId, ticket.id);
        toast.info(t("toast.queued"));
        return;
      }
      const detail = e instanceof ApiError ? e.body?.message : undefined;
      toast.error(t(v.media.length ? "toast.fileError" : "toast.sendError"), {
        description: detail,
      });
    },
  });

  // Reenvia mensagens de texto enfileiradas quando a conexão volta.
  // Cada item tem id único e só sai da fila após confirmação do backend,
  // e a mensagem confirmada entra no cache sem duplicar (checagem por id).
  const apiState = useConnectivity().api;
  useEffect(() => {
    let flushing = false;
    const flush = async () => {
      if (flushing) return; // evita reenvio duplo em eventos simultâneos
      flushing = true;
      try {
        const pending = listOutbox(companyId).filter((m) => m.ticketId === ticket.id);
        for (const item of pending) {
          try {
            const message = await sendMessage(ticket.id, item.body, item.isPrivate, null);
            removeFromOutbox(companyId, item.id);
            if (message?.id) {
              qc.setQueryData<Message[]>(ticketKeys.messages(ticket.id), (previous = []) =>
                previous.some((m) => m.id === message.id) ? previous : [...previous, message],
              );
            }
          } catch {
            return; // ainda sem conexão: tenta de novo no próximo evento
          }
        }
        if (pending.length) void qc.invalidateQueries({ queryKey: ticketKeys.all });
      } finally {
        flushing = false;
      }
    };
    window.addEventListener("online", flush);
    // Também dispara quando a sonda confirma que a API voltou.
    if (apiState === "online") void flush();
    return () => window.removeEventListener("online", flush);
  }, [companyId, ticket.id, qc, apiState]);

  const addFiles = (input: File[]) => {
    const list = input.filter((f) => !isDangerousFile(f.name));
    if (list.length < input.length) toast.error(t("toast.fileBlocked"));
    const ok = list.filter((f) => f.size > 0 && f.size <= MAX_MEDIA_BYTES);
    if (ok.length < list.length) toast.error(t("toast.fileTooLarge"));
    if (!ok.length) return;
    setFiles((current) => {
      setActive(Math.min(current.length, 9));
      return [...current, ...ok].slice(0, 10);
    });
    // Imagem nova abre o editor direto, como no WhatsApp Web (GIF mantém a animação).
    const first = ok[0]!;
    if (first.type.startsWith("image/") && first.type !== "image/gif") setImageEditorOpen(true);
  };
  const named = (f: File, i: number) => {
    if (f.name && f.name !== "image.png") return f;
    const ext = f.type.split("/")[1]?.replace("jpeg", "jpg") || "bin";
    const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
    return new File([f], `colado-${stamp}-${i + 1}.${ext}`, { type: f.type });
  };
  const filesFrom = (data: DataTransfer | null) => {
    if (!data) return [];
    const list = Array.from(data.files);
    if (!list.length)
      for (const item of Array.from(data.items ?? []))
        if (item.kind === "file") {
          const f = item.getAsFile();
          if (f) list.push(f);
        }
    return list.map(named);
  };
  const canAttach = !isPrivate && !send.isPending;
  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const list = filesFrom(e.clipboardData);
    if (!list.length) return; // texto comum: o navegador cola normalmente
    e.preventDefault();
    if (!canAttach) {
      toast.error(t("toast.attachUnavailable"));
      return;
    }
    addFiles(list);
  };
  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      if (!Array.from(e.dataTransfer.types).includes("Files")) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = canAttach ? "copy" : "none";
      setDragging(true);
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
    },
    onDrop: (e: React.DragEvent) => {
      const list = filesFrom(e.dataTransfer);
      setDragging(false);
      if (!list.length) return;
      e.preventDefault();
      if (!canAttach) {
        toast.error(t("toast.attachUnavailable"));
        return;
      }
      addFiles(list);
    },
  };
  const selectFile = (f: File | null) => f && addFiles([f]);
  const replaceActive = (f: File) =>
    setFiles((current) => current.map((item, i) => (i === active ? f : item)));
  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, i) => i !== index));
    setActive((a) => Math.max(0, a >= index ? a - 1 : a));
  };

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    e.target.value = "";
    addFiles(list);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if ((body || files.length) && !send.isPending) send.mutate({ body, media: files });
  };

  return (
    <>
      {editingContact && (
        <ContactFormDialog
          value={editingContact}
          onClose={() => setEditingContact(null)}
          onSaved={() =>
            Promise.all([
              qc.invalidateQueries({ queryKey: ticketKeys.all }),
              qc.invalidateQueries({ queryKey: contactKeys.all }),
            ])
          }
        />
      )}
      <header className="flex shrink-0 items-center gap-1.5 border-b px-1.5 py-1.5 pt-[max(0.375rem,env(safe-area-inset-top))] sm:gap-3 sm:px-4 sm:py-2.5">
        <Button
          variant="ghost"
          size="icon"
          className="-mr-1 shrink-0 md:hidden"
          onClick={onBack}
          aria-label={t("actions.back")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex size-9 shrink-0 items-center justify-center self-center rounded-full bg-primary/10 font-semibold text-primary sm:size-11 sm:text-lg">
          {(ticket.contact.name || "#").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2">
            <p className="truncate font-semibold leading-tight">
              {ticket.contact.name || `+${ticket.contact.number}`}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="-ml-1 size-7 shrink-0"
              aria-label={t("actions.editContact")}
              title={t("actions.editContact")}
              onClick={() => void openContactEditor()}
            >
              <Pencil className="size-3.5" />
            </Button>
            <span className="truncate text-xs text-muted-foreground">+{ticket.contact.number}</span>
          </div>
          <div className="mt-1 flex items-center gap-1 overflow-x-auto text-[11px] [scrollbar-width:none] sm:flex-wrap">
            {session.user?.companyName && (
              <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground">
                {t("context.company")}:{" "}
                <span className="font-medium text-foreground">{session.user.companyName}</span>
              </span>
            )}
            <span className="shrink-0 rounded-md bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-700 dark:text-emerald-300">
              {t("origin")}: {ticket.whatsapp?.name ?? t("unknownOrigin")}
              {ticket.whatsapp?.number ? ` · +${ticket.whatsapp.number}` : ""}
            </span>
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground">
              {t("context.queue")}:{" "}
              <span className="font-medium text-foreground">
                {ticket.queue?.name ?? t("noQueue")}
              </span>
            </span>
            <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground">
              {t("attendant")}:{" "}
              <span
                className={cn(
                  "font-medium",
                  ticket.user ? attendantBadgeColor(ticket.user).text : "text-foreground",
                )}
              >
                {ticket.user?.name ?? t("noAttendant")}
              </span>
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] sm:flex-wrap">
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
        <div className="flex shrink-0 items-center justify-end gap-0.5 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-pressed={muted}
            aria-label={muted ? t("mute.unmute") : t("mute.mute")}
            title={muted ? t("mute.unmute") : t("mute.mute")}
            onClick={() => {
              if (!muteKey) return;
              setMuted(muteKey, ticket.contact.id, !muted);
              toast.success(muted ? t("mute.unmutedToast") : t("mute.mutedToast"));
            }}
          >
            {muted ? <BellOff className="size-4" /> : <Bell className="size-4" />}
          </Button>
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
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("actions.refuse")}
              title={t("actions.refuse")}
              onClick={() => refuse.mutate()}
              disabled={refuse.isPending}
            >
              <Undo2 className="size-4" />
            </Button>
          )}
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
              className="bg-destructive font-semibold text-destructive-foreground shadow-sm hover:bg-destructive/90"
              onClick={async () => {
                // Mensagem de agradecimento ativada: finaliza direto, sem perguntar.
                const cfg = await qc
                  .fetchQuery(closingMessageQuery(String(session.user?.companyId ?? "")))
                  .catch(() => null);
                const msg = cfg?.enabled ? cfg.message.trim() : "";
                if (msg) closeWithMessage.mutate(msg);
                else setCloseOpen(true);
              }}
              disabled={status.isPending || closeWithMessage.isPending}
            >
              {t("actions.close")}
            </Button>
          )}
          <CloseTicketDialog
            open={closeOpen}
            onOpenChange={setCloseOpen}
            pending={closeWithMessage.isPending}
            onConfirm={(msg) => closeWithMessage.mutate(msg)}
          />
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
                    id={`msg-${m.id}`}
                    onContextMenu={(event) => {
                      if (ticket.status !== "open" || m.isPrivate) return;
                      event.preventDefault();
                      setReplyTo(m);
                    }}
                    className={cn(
                      "group flex min-w-0 items-center gap-1",
                      m.fromMe ? "flex-row-reverse" : "flex-row",
                    )}
                  >
                    <div
                      className={cn(
                        "min-w-0 max-w-[90%] rounded-lg px-3 py-2 text-sm shadow-sm transition-shadow sm:max-w-[75%]",
                        highlightId === m.id && "ring-2 ring-primary",
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
                        <p className="mb-1 truncate text-xs font-semibold text-foreground/80">
                          {m.ticket?.user?.name ?? ticket.user?.name}
                        </p>
                      )}
                      {m.quotedMsg && (
                        <button
                          type="button"
                          onClick={() => m.quotedMsg?.id && jumpTo(String(m.quotedMsg.id))}
                          className="mb-1 block w-full rounded border-l-4 border-primary bg-muted/60 px-2 py-1 text-left text-xs"
                        >
                          <span className="block font-semibold text-primary">
                            {m.quotedMsg.fromMe ? t("reply.you") : ticket.contact.name}
                          </span>
                          <span className="line-clamp-2 text-muted-foreground">
                            {quoteLabel(m.quotedMsg)}
                          </span>
                        </button>
                      )}
                      <MessageMedia message={m} />
                      {displayBody(m) && isVCard(displayBody(m)) ? (
                        <div className="flex flex-col gap-1.5">
                          {parseVCards(displayBody(m)!).map((contact, i) => (
                            <ContactCard key={i} contact={contact} />
                          ))}
                        </div>
                      ) : displayBody(m) && parseLocation(displayBody(m)) ? (
                        <LocationCard location={parseLocation(displayBody(m))!} />
                      ) : (
                        displayBody(m) && (
                          <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                            {displayBody(m)}
                          </p>
                        )
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
                    {ticket.status === "open" && !m.isPrivate && (
                      <button
                        type="button"
                        aria-label={t("reply.action")}
                        title={t("reply.action")}
                        onClick={() => setReplyTo(m)}
                        className="shrink-0 rounded-full p-1.5 text-muted-foreground opacity-60 hover:bg-muted hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <Reply className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
              <div ref={endRef} />
            </>
          )}
        </QueryBoundary>
      </div>
      {ticket.status === "open" ? (
        <form
          onSubmit={submit}
          {...dropHandlers}
          className={cn(
            "relative min-w-0 shrink-0 border-t p-2 sm:p-3",
            dragging && "bg-primary/10 ring-2 ring-inset ring-primary",
          )}
        >
          {dragging && (
            <p className="pointer-events-none absolute inset-x-0 -top-10 z-10 mx-auto w-fit rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground shadow">
              {t("composer.dropHere")}
            </p>
          )}
          {replyTo && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border-l-4 border-primary bg-muted/60 p-2 text-xs">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-primary">
                  {replyTo.fromMe ? t("reply.you") : ticket.contact.name}
                </p>
                <p className="truncate text-muted-foreground">{quoteLabel(replyTo)}</p>
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
          {upload && (
            <div
              className="mb-2 flex items-center gap-2 rounded-lg border bg-card p-2 text-xs"
              role="status"
            >
              <div className="min-w-0 flex-1">
                <p className="mb-1 truncate">
                  {t("composer.uploading", {
                    current: upload.index + 1,
                    total: upload.total,
                    percent: upload.percent,
                  })}
                </p>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-[width]"
                    style={{ width: `${upload.percent}%` }}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => uploadAbort.current?.abort()}
              >
                {t("composer.cancelUpload")}
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
                {preview ? (
                  <button
                    type="button"
                    onClick={() => setImageEditorOpen(true)}
                    aria-label={t("composer.editImage")}
                  >
                    <img
                      src={preview}
                      alt={file.name}
                      className="h-24 max-w-40 rounded object-cover sm:h-32"
                    />
                  </button>
                ) : videoPreview ? (
                  <video
                    src={videoPreview}
                    controls
                    preload="metadata"
                    className="h-24 max-w-48 rounded bg-foreground sm:h-32"
                  />
                ) : audioPreview ? (
                  <audio controls preload="metadata" src={audioPreview} className="max-w-52" />
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
                {preview && (
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
                  aria-label={t("composer.removeAttachment")}
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
                    {thumbs[index] ? (
                      <img src={thumbs[index]!} alt="" className="size-full object-cover" />
                    ) : f.type.startsWith("video/") ? (
                      <Video className="size-5 text-muted-foreground" />
                    ) : (
                      <FileText className="size-5 text-muted-foreground" />
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => galleryRef.current?.click()}
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
                title: t("imageEditor.title"),
                rotate: t("imageEditor.rotate"),
                draw: t("imageEditor.draw"),
                highlighter: t("imageEditor.highlighter"),
                arrow: t("imageEditor.arrow"),
                circle: t("imageEditor.circle"),
                rectangle: t("imageEditor.rectangle"),
                text: t("imageEditor.text"),
                eraser: t("imageEditor.eraser"),
                blur: t("imageEditor.blur"),
                crop: t("imageEditor.crop"),
                color: t("imageEditor.color"),
                thickness: t("imageEditor.thickness"),
                textSize: t("imageEditor.textSize"),
                textPlaceholder: t("imageEditor.textPlaceholder"),
                undo: t("imageEditor.undo"),
                redo: t("imageEditor.redo"),
                restore: t("imageEditor.restore"),
                canvas: t("imageEditor.canvas"),
                loading: t("imageEditor.loading"),
                cancel: t("imageEditor.cancel"),
                apply: t("imageEditor.apply"),
              }}
            />
          )}
          {isAdmin && (companyUsers.data?.length ?? 0) > 0 && (
            <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
              <label htmlFor={`reply-as-${ticket.id}`} className="text-xs text-muted-foreground">
                {t("composer.replyAs")}
              </label>
              <select
                id={`reply-as-${ticket.id}`}
                aria-label={t("composer.replyAs")}
                value={replyAsId ?? ""}
                disabled={send.isPending}
                onChange={(e) => setReplyAsId(e.target.value ? Number(e.target.value) : null)}
                className="h-8 min-w-0 max-w-full rounded-md border bg-background px-2 text-xs text-foreground"
              >
                <option value="">{t("composer.replyAsMe")}</option>
                {(companyUsers.data ?? [])
                  .filter((u) => u.id !== myId)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
              <span className="min-w-0 break-words text-xs text-muted-foreground">
                {t("composer.signingAs", { name: senderName })}
              </span>
              {replyAsId !== null && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  disabled={send.isPending}
                  onClick={() => setReplyAsId(null)}
                  aria-label={t("composer.replyAsMe")}
                  title={t("composer.replyAsMe")}
                >
                  <Undo2 className="size-3.5" />
                </Button>
              )}
            </div>
          )}
          <div className="grid grid-cols-[auto_auto_auto_auto_auto_minmax(0,1fr)_auto] items-center gap-1 sm:gap-2 [&>button]:size-8 sm:[&>button]:size-10">
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
                setFiles([]);
              }}
            >
              <Lock className="size-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isPrivate || send.isPending}
                  aria-label={t("composer.attach")}
                  title={t("composer.attach")}
                >
                  <Paperclip className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top">
                <DropdownMenuItem onSelect={() => galleryRef.current?.click()}>
                  <ImageIcon className="size-4 text-primary" />
                  {t("composer.attachGallery")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => cameraRef.current?.click()}>
                  <Camera className="size-4 text-primary" />
                  {t("composer.attachCamera")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
                  <FileText className="size-4 text-primary" />
                  {t("composer.attachDocument")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setShareOpen(true)}>
                  <ContactIcon className="size-4 text-primary" />
                  {t("composer.attachContact")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ShareContactDialog
              open={shareOpen}
              onOpenChange={setShareOpen}
              onPick={(c) => {
                setShareOpen(false);
                shareContact.mutate(c);
              }}
            />
            <input ref={fileRef} type="file" multiple className="hidden" onChange={pickFile} />
            <input
              ref={galleryRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={pickFile}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={pickFile}
            />
            <AudioRecorder
              disabled={isPrivate || send.isPending || files.length > 0}
              labels={{
                start: t("audio.start"),
                stop: t("audio.stop"),
                cancel: t("audio.cancel"),
                recording: t("audio.recording"),
                unsupported: t("audio.unsupported"),
              }}
              onReady={(audio) => {
                // Gravou e parou: envia direto, sem etapa de confirmação.
                if (!send.isPending)
                  send.mutate({ body: "", media: [audio], keepComposer: true });
              }}
              onError={(reason) => toast.error(t(`audio.errors.${reason}`))}
            />
            <textarea
              ref={inputRef}
              rows={2}
              disabled={send.isPending}
              value={text}
              className="min-w-0 w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onKeyDown={onComposerKey}
              onPaste={onPaste}
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
