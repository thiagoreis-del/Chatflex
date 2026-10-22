import { MapPin, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ParsedLocation } from "../location";

/** Cartão de localização compartilhada, com link para abrir no mapa. */
export function LocationCard({ location }: { location: ParsedLocation }) {
  const { t } = useTranslation("tickets");
  return (
    <a
      href={location.mapsUrl}
      target="_blank"
      rel="noreferrer"
      className="flex min-w-52 items-center gap-3 rounded-md bg-background/60 px-3 py-2.5 transition-colors hover:bg-background/80"
    >
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
      >
        <MapPin className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">
          {t("locationCard.label")}
        </span>
        {location.lat !== 0 && (
          <span className="block truncate text-xs text-muted-foreground">
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </span>
        )}
        <span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-primary">
          {t("locationCard.open")}
          <ExternalLink className="size-3" aria-hidden />
        </span>
      </span>
    </a>
  );
}
