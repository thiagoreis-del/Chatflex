import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { quickMessagesQuery } from "../api";
import type { QuickMessage } from "../types";

export function filterQuickMessages(list: QuickMessage[], term: string) {
  const q = term.toLowerCase();
  return list.filter(
    (m) => m.shortcode.includes(q) || (q.length > 1 && m.message.toLowerCase().includes(q)),
  );
}

/** Lista flutuante de respostas rápidas usada no compositor do atendimento. */
export function QuickMessagePicker({
  term,
  activeIndex,
  onPick,
}: {
  term: string;
  activeIndex: number;
  onPick: (m: QuickMessage) => void;
}) {
  const { t } = useTranslation("quickMessages");
  const query = useQuery(quickMessagesQuery());
  const items = filterQuickMessages(query.data ?? [], term).slice(0, 8);
  return (
    <div
      role="listbox"
      aria-label={t("picker.open")}
      className="absolute bottom-full left-3 right-3 mb-2 max-h-64 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg"
    >
      {items.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">{t("picker.empty")}</p>
      ) : (
        items.map((m, i) => (
          <button
            key={m.id}
            type="button"
            role="option"
            aria-selected={i === activeIndex}
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(m);
            }}
            className={cn(
              "block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent",
              i === activeIndex && "bg-accent",
            )}
          >
            <span className="font-semibold text-primary">/{m.shortcode}</span>
            <span className="ml-2 line-clamp-1 text-muted-foreground">{m.message}</span>
          </button>
        ))
      )}
    </div>
  );
}
