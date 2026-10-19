import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Bell, BellRing } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/shared/auth/session-store";
import { socketClient } from "@/shared/socket/socket-client";
import { incomingTicketsQuery, messagesQuery } from "../api";
import { IncomingMessageTracker } from "../incoming-message-tracker";
import { isMuted, mutedKey } from "../muted-contacts";
import type { Message, Ticket } from "../types";

export function IncomingNotifications() {
  const { user } = useSession();
  // Remounting isolates deduplication and asynchronous work when the session changes.
  return user ? (
    <SessionNotifications
      key={`${user.companyId}:${user.id}`}
      companyId={user.companyId}
      muteKey={mutedKey(user.companyId, user.id)}
    />
  ) : null;
}

function SessionNotifications({ companyId, muteKey }: { companyId: string; muteKey: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [sound, setSound] = useState(true);
  const [desktop, setDesktop] = useState(false);
  const [count, setCount] = useState(0);
  const audio = useRef<AudioContext | null>(null);
  const tracker = useRef(new IncomingMessageTracker(Date.now()));
  const previous = useRef(new Map<number, string>());
  const tickets = useQuery(incomingTicketsQuery(companyId));
  const settings = useRef({ sound, desktop });
  settings.current = { sound, desktop };

  const prepareAudio = () => {
    try {
      const Audio =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Audio) return;
      audio.current ??= new Audio();
      void audio.current.resume().catch(() => {});
    } catch {
      /* Audio may be unavailable on this device. */
    }
  };
  const playSound = () => {
    const context = audio.current;
    if (!context || context.state !== "running") return;
    const gain = context.createGain();
    gain.connect(context.destination);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.4);
    const tone = context.createOscillator();
    tone.type = "sine";
    tone.frequency.setValueAtTime(880, context.currentTime);
    tone.frequency.setValueAtTime(1174, context.currentTime + 0.16);
    tone.connect(gain);
    tone.start();
    tone.stop(context.currentTime + 0.42);
    tone.onended = () => {
      tone.disconnect();
      gain.disconnect();
    };
  };

  const notify = useRef<(message: Message, ticket?: Ticket) => void>(() => {});
  notify.current = (message, ticket) => {
    if (!tracker.current.accept(message)) return;
    const owner = ticket ?? tickets.data?.find((x) => x.id === message.ticketId);
    // Contato ou grupo silenciado: a mensagem chega no chat, mas sem som nem aviso.
    if (isMuted(muteKey, owner?.contact?.id)) return;
    setCount((value) => value + 1);
    if (settings.current.sound) playSound();
    const title = t("notifications.newMessage", {
      contact: ticket?.contact?.name || t("notifications.customer"),
    });
    toast(title, {
      description: t("notifications.received"),
      action: {
        label: t("notifications.view"),
        onClick: () => {
          void navigate({ to: "/app/atendimento" });
        },
      },
    });
    if (
      settings.current.desktop &&
      "Notification" in window &&
      Notification.permission === "granted" &&
      document.visibilityState !== "visible"
    ) {
      try {
        // No customer text on the lock screen.
        const notification = new Notification(t("appName"), {
          body: t("notifications.received"),
          tag: `message-${message.id}`,
        });
        notification.onclick = () => {
          window.focus();
          void navigate({ to: "/app/atendimento" });
          notification.close();
        };
      } catch {
        /* iOS may require an installed app and a push service. */
      }
    }
  };

  useEffect(() => {
    const unlock = () => prepareAudio();
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
      void audio.current?.close().catch(() => {});
    };
  }, []);

  useEffect(() => {
    const leave = socketClient.joinRoom("joinNotification", "leaveNotification");
    const off = socketClient.onCompany("appMessage", (raw) => {
      const payload = raw as { action?: string; message?: Message; ticket?: Ticket } | null;
      if (payload?.action === "create" && payload.message)
        notify.current(payload.message, payload.ticket);
    });
    return () => {
      off();
      leave();
    };
  }, []);

  useEffect(() => {
    if (!tickets.data) return;
    let cancelled = false;
    const changed: Ticket[] = [];
    for (const ticket of tickets.data) {
      const signature = `${ticket.updatedAt}:${ticket.unreadMessages}:${ticket.lastMessage}`;
      if (previous.current.get(ticket.id) !== signature && ticket.unreadMessages > 0)
        changed.push(ticket);
      previous.current.set(ticket.id, signature);
    }
    void (async () => {
      for (let i = 0; i < changed.length && !cancelled; i += 5) {
        await Promise.all(
          changed.slice(i, i + 5).map(async (ticket) => {
            try {
              const messages = await qc.fetchQuery({ ...messagesQuery(ticket.id), staleTime: 0 });
              if (!cancelled) for (const message of messages) notify.current(message, ticket);
            } catch {
              // Retry unchanged tickets after a temporary messages failure.
              if (!cancelled) previous.current.delete(ticket.id);
            }
          }),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tickets.data, qc]);

  const enableDesktop = async (checked: boolean) => {
    if (!checked) {
      setDesktop(false);
      return;
    }
    if (!("Notification" in window)) {
      toast.info(t("notifications.unsupported"));
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setDesktop(permission === "granted");
      if (permission !== "granted") toast.info(t("notifications.denied"));
    } catch {
      toast.info(t("notifications.unsupported"));
    }
  };

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) {
          setCount(0);
          prepareAudio();
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative shrink-0"
          aria-label={t("notifications.menu")}
          title={t("notifications.menu")}
        >
          {count ? (
            <BellRing className="size-4" aria-hidden />
          ) : (
            <Bell className="size-4" aria-hidden />
          )}
          {count > 0 && (
            <span className="absolute right-0 top-0 grid min-w-4 h-4 place-items-center rounded-full bg-primary px-0.5 text-[10px] text-primary-foreground">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-w-[90vw]">
        <DropdownMenuLabel>{t("notifications.menu")}</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked={sound} onCheckedChange={setSound}>
          {t("notifications.sound")}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={desktop}
          onCheckedChange={(checked) => void enableDesktop(checked)}
        >
          {t("notifications.desktop")}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            prepareAudio();
            playSound();
            toast.success(t("notifications.testDone"));
          }}
        >
          {t("notifications.test")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
