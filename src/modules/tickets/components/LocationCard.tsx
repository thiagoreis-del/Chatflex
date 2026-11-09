import { MapPin, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ParsedLocation } from "../location";

/** Cartão de localização compartilhada, com link para abrir no mapa. */
export function LocationCard({ location, label }: { location: ParsedLocation; label?: string }) {
  const { t } = useTranslation("tickets");
  const previewUrl =
    location.lat !== 0
      ? `https://maps.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`
      : null;
  return (
    <div className="min-w-56 max-w-sm overflow-hidden rounded-lg bg-background/65 shadow-sm ring-1 ring-border/60">
      {location.thumbnailUrl ? (
        <img src={location.thumbnailUrl} alt="" className="h-32 w-full object-cover" />
      ) : previewUrl ? (
        <iframe
          src={previewUrl}
          title={t("locationCard.mapTitle")}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-36 w-full border-0"
          tabIndex={-1}
        />
      ) : null}
      <a
        href={location.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
        >
          <MapPin className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block break-words text-sm font-semibold text-foreground">
            {location.name || label?.split("\n")[0] || t("locationCard.label")}
          </span>
          <span className="block whitespace-pre-wrap break-words text-xs text-muted-foreground">
            {location.address ||
              label?.split("\n").slice(1).join("\n") ||
              (location.lat !== 0
                ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                : t("locationCard.open"))}
          </span>
          <ExternalLink className="mt-1 size-3 text-primary" aria-hidden />
        </span>
      </a>
    </div>
  );
}
