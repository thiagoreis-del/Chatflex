import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCopy, ExternalLink, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { quickMessagesQuery } from "@/modules/quick-messages/api";
import { filterQuickMessages } from "@/modules/quick-messages/components/QuickMessagePicker";
import type { AuthenticatedUser } from "@/shared/auth/types";
import { useSession } from "@/shared/auth/session-store";
import { PageHeader, QueryBoundary } from "@/shared/components";

const messengerUrl = "https://www.facebook.com/messages/t/";
const templates = ["availability", "interest", "pickup", "followUp"] as const;

export function MarketplacePage() {
  const { user } = useSession();
  if (!user) return null;
  return <ReplyWorkspace key={JSON.stringify([user.companyId, user.id])} user={user} />;
}

function ReplyWorkspace({ user }: { user: AuthenticatedUser }) {
  const { t } = useTranslation("marketplace");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [copyStatus, setCopyStatus] = useState<"copied" | "copyFailed" | null>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const saved = useQuery(quickMessagesQuery(user.companyId, user.id));

  const insert = (text: string) => {
    setDraft((current) => (current.trim() ? `${current.trimEnd()}\n\n${text}` : text));
    setCopyStatus(null);
    editor.current?.focus();
  };

  const copy = async () => {
    if (!draft.trim()) return;
    try {
      await navigator.clipboard.writeText(draft.trim());
      setCopyStatus("copied");
    } catch {
      editor.current?.focus();
      editor.current?.select();
      setCopyStatus("copyFailed");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button asChild>
            <a href={messengerUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" aria-hidden />
              {t("openMessenger")}
            </a>
          </Button>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-5">
          <div className="space-y-2">
            <Label htmlFor="marketplace-reply">{t("draft.label")}</Label>
            <Textarea
              id="marketplace-reply"
              ref={editor}
              className="min-h-44 resize-y"
              placeholder={t("draft.placeholder")}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setCopyStatus(null);
              }}
              aria-describedby="marketplace-reply-help"
            />
            <p id="marketplace-reply-help" className="text-sm text-muted-foreground">
              {t("draft.help")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={() => void copy()} disabled={!draft.trim()}>
              <ClipboardCopy className="size-4" aria-hidden />
              {t("draft.copy")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={!draft}
              onClick={() => {
                setDraft("");
                setCopyStatus(null);
                editor.current?.focus();
              }}
            >
              {t("draft.clear")}
            </Button>
            <span className="text-sm text-muted-foreground" role="status">
              {copyStatus ? t(`draft.${copyStatus}`) : null}
            </span>
          </div>
        </section>

        <section className="min-w-0 space-y-4 rounded-xl border bg-card p-4 sm:p-5">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">{t("templates.title")}</h2>
            <div className="flex flex-wrap gap-2">
              {templates.map((id) => (
                <Button
                  key={id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insert(t(`templates.${id}.text`))}
                >
                  <Plus className="size-3.5" aria-hidden />
                  {t(`templates.${id}.label`)}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="marketplace-reply-search">{t("saved.title")}</Label>
            <Input
              id="marketplace-reply-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("saved.search")}
            />
            <QueryBoundary query={saved}>
              {(items) => {
                const visible = filterQuickMessages(items, search.trim().replace(/^\//, ""));
                if (!visible.length) {
                  return (
                    <p className="text-sm text-muted-foreground">
                      {t(items.length ? "saved.noMatch" : "saved.empty")}
                    </p>
                  );
                }
                return (
                  <ul className="max-h-64 divide-y overflow-y-auto rounded-md border">
                    {visible.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                          onClick={() => insert(item.message)}
                        >
                          <span className="block truncate text-sm font-medium">
                            /{item.shortcode}
                          </span>
                          <span className="line-clamp-2 break-words text-sm text-muted-foreground">
                            {item.message}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                );
              }}
            </QueryBoundary>
          </div>
        </section>
      </div>
    </div>
  );
}
