import { Megaphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ParsedAdvertisement } from "../advertisement";

export function AdvertisementCard({ advertisement }: { advertisement: ParsedAdvertisement }) {
  const { t } = useTranslation("tickets");
  const header = (
    <div className="flex min-w-0 items-center gap-2 rounded-md bg-black/10 p-2">
      {advertisement.thumbnailUrl ? (
        <img
          src={advertisement.thumbnailUrl}
          alt=""
          className="size-11 shrink-0 rounded object-cover"
        />
      ) : (
        <span className="flex size-11 shrink-0 items-center justify-center rounded bg-primary/15 text-primary">
          <Megaphone className="size-5" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-foreground">
          {t("advertisement.label")}
        </span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {advertisement.title || advertisement.description || t("advertisement.details")}
        </span>
      </span>
    </div>
  );

  return (
    <div className="min-w-56 max-w-md space-y-2">
      {advertisement.sourceUrl ? (
        <a
          href={advertisement.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {header}
        </a>
      ) : (
        header
      )}
      {advertisement.message && (
        <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{advertisement.message}</p>
      )}
    </div>
  );
}
