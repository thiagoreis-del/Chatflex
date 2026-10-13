import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { EmptyState, QueryBoundary } from "@/shared/components";
import { ticketKeys } from "@/shared/api/query-keys";
import {
  messagesQuery,
  sendMessage,
  ticketsContract,
  ticketsQuery,
  updateTicketStatus,
} from "../api";
import type { Ticket, TicketStatus } from "../types";

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

export function TicketsPage() {
  const { t } = useTranslation("tickets");
  const [status, setStatus] = useState<TicketStatus>("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const query = useQuery(ticketsQuery({ status, search }));

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[480px] overflow-hidden rounded-xl border bg-card shadow-sm">
      <aside
        className={cn(
          "flex w-full flex-col border-r md:w-80 md:shrink-0",
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
        <div className="flex-1 overflow-y-auto">
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
                          {tk.contact.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-medium">{tk.contact.name}</span>
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
                          <span
                            className="mt-1 inline-block rounded px-1.5 text-[11px] font-medium text-primary-foreground"
                            style={{
                              backgroundColor: tk.queue?.color ?? "var(--muted-foreground)",
                            }}
                          >
                            {tk.queue?.name ?? t("noQueue")}
                          </span>
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
      <section className={cn("flex flex-1 flex-col", !selected && "hidden md:flex")}>
        {selected ? (
          <Conversation
            key={selected.id}
            ticket={selected}
            onBack={() => setSelected(null)}
            onChange={setSelected}
          />
        ) : (
          <div className="m-auto">
            <EmptyState
              icon={MessagesSquare}
              title={t("selectTitle")}
              description={t("selectDescription")}
            />
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
  const qc = useQueryClient();
  const messages = useQuery(messagesQuery(ticket.id));
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.data?.length]);

  const status = useMutation({
    mutationFn: (s: TicketStatus) => updateTicketStatus(ticket.id, s),
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
  const send = useMutation({
    mutationFn: (body: string) => sendMessage(ticket.id, body),
    onSuccess: () => {
      setText("");
      void qc.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onError: () => toast.error(t("toast.sendError")),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (body && !send.isPending) send.mutate(body);
  };

  return (
    <>
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onBack}
          aria-label={t("actions.back")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{ticket.contact.name}</p>
          <p className="text-xs text-muted-foreground">+{ticket.contact.number}</p>
        </div>
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
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto bg-muted/30 p-4">
        <QueryBoundary query={messages} contract="GET /messages/:ticketId">
          {(list) => (
            <>
              {list.map((m) => (
                <div key={m.id} className={cn("flex", m.fromMe ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                      m.fromMe
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm bg-card",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p
                      className={cn(
                        "mt-1 text-right text-[10px]",
                        m.fromMe ? "text-primary-foreground/70" : "text-muted-foreground",
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
        <form onSubmit={submit} className="flex gap-2 border-t p-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("composer.placeholder")}
            aria-label={t("composer.placeholder")}
          />
          <Button
            type="submit"
            disabled={!text.trim() || send.isPending}
            aria-label={t("composer.send")}
          >
            <Send className="size-4" />
          </Button>
        </form>
      ) : (
        <p className="border-t p-3 text-center text-sm text-muted-foreground">
          {t("composer.acceptFirst")}
        </p>
      )}
    </>
  );
}
