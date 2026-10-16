import { useEffect } from "react";
import { WifiOff, ServerCrash } from "lucide-react";
import { i18n } from "@/shared/i18n";
import {
  bannerKind,
  startConnectivityMonitor,
  useConnectivity,
} from "@/shared/connectivity/connectivity";

/**
 * Aviso discreto baseado em sondas reais ao backend (não só navigator.onLine).
 * - "internet": navegador sem rede e API inalcançável;
 * - "backend": navegador online, mas o servidor não responde;
 * - queda só do WebSocket nunca exibe aviso (o polling cobre).
 * Some sozinho quando a conectividade volta.
 */
export function OfflineNotice() {
  const connectivity = useConnectivity();

  useEffect(() => {
    startConnectivityMonitor();
  }, []);

  const kind = bannerKind(connectivity);
  if (!kind) return null;

  const Icon = kind === "internet" ? WifiOff : ServerCrash;
  const text =
    kind === "internet"
      ? i18n.t("offline.banner", {
          defaultValue:
            "Sem conexão com a internet. As mensagens serão enviadas quando a conexão voltar.",
        })
      : i18n.t("offline.backend", {
          defaultValue:
            "Servidor indisponível no momento. Tentando reconectar automaticamente…",
        });

  return (
    <div
      role="alert"
      className="pointer-events-none fixed inset-x-0 top-2 z-[100] flex justify-center px-3 pt-[max(0.25rem,env(safe-area-inset-top))]"
    >
      <div className="flex max-w-full items-center gap-2 rounded-full border border-warning/40 bg-warning/95 px-3 py-1 text-center text-xs font-semibold text-warning-foreground shadow-md backdrop-blur">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className="min-w-0 truncate">{text}</span>
      </div>
    </div>
  );
}
