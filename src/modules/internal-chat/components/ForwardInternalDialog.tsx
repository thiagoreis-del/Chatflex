import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Hash, UserRound, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { internalChatKeys } from "@/shared/api/query-keys";
import { internalConversationsQuery, sendInternalMedia, sendInternalMessage } from "../api";
import { stripQuote } from "../quote";
import type { InternalConversationKind, InternalMessage } from "../types";

const KIND_ICONS: Record<InternalConversationKind, typeof UserRound> = {
  direct: UserRound,
  group: Users,
  queue: Hash,
};

export interface ForwardInternalDialogProps {
  message: InternalMessage | null;
  currentConversationId: number;
  companyId: string;
  onClose: () => void;
}

/** Encaminha a mensagem para outra conversa interna (texto e/ou mídia). */
export function ForwardInternalDialog({
  message,
  currentConversationId,
  companyId,
  onClose,
}: ForwardInternalDialogProps) {
  const { t } = useTranslation("internalChat");
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const list = useQuery({ ...internalConversationsQuery(companyId), enabled: !!message });

  const send = useMutation({
    mutationFn: async (targetId: number) => {
      const body = stripQuote(message?.body ?? "").trim();
      if (message?.mediaUrl) {
        const response = await fetch(message.mediaUrl);
        if (!response.ok) throw new Error("media");
        const blob = await response.blob();
        const file = new File([blob], message.mediaName || "arquivo", { type: blob.type });
        return sendInternalMedia(targetId, file, body);
      }
      if (!body) throw new Error("empty");
      return sendInternalMessage(targetId, body);
    },
    onSuccess: (_message, targetId) => {
      void qc.invalidateQueries({ queryKey: internalChatKeys.messages(targetId) });
      void qc.invalidateQueries({ queryKey: internalChatKeys.conversations(companyId) });
      toast.success(t("forward.done"));
      onClose();
    },
    onError: () => toast.error(t("forward.failed")),
  });

  const term = search.trim().toLowerCase();
  const conversations = (list.data ?? []).filter(
    (c) => c.id !== currentConversationId && (!term || c.title.toLowerCase().includes(term)),
  );

  return (
    <Dialog open={!!message} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("forward.title")}</DialogTitle>
        </DialogHeader>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("forward.search")}
          aria-label={t("forward.search")}
        />
        <ul className="max-h-80 overflow-y-auto">
          {list.isLoading && (
            <li className="p-3 text-sm text-muted-foreground">{t("forward.loading")}</li>
          )}
          {!list.isLoading && conversations.length === 0 && (
            <li className="p-3 text-sm text-muted-foreground">{t("forward.empty")}</li>
          )}
          {conversations.map((conversation) => {
            const Icon = KIND_ICONS[conversation.kind];
            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  disabled={send.isPending}
                  onClick={() => send.mutate(conversation.id)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-muted focus-visible:bg-muted disabled:opacity-50"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {conversation.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {t(`kinds.${conversation.kind}`)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
