import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { i18n } from "@/shared/i18n";
import { useApiStatus } from "@/shared/api/api-status";

/**
 * Aviso discreto exibido somente quando a API está de fato inacessível.
 * Não confia apenas em navigator.onLine, que dá falso negativo em VPN,
 * portal cativo e adaptadores Wi-Fi sem gateway.
 */
export function OfflineNotice() {
  const apiStatus = useApiStatus();
  const [navigatorOffline, setNavigatorOffline] = useState(() =>
    typeof navigator === "undefined" ? false : !navigator.onLine,
  );

  useEffect(() => {
    const goOffline = () => setNavigatorOffline(true);
    const goOnline = () => setNavigatorOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  // "online" na API vence qualquer sinal do navegador: se as respostas chegam, não há aviso.
  if (apiStatus === "online") return null;
  if (!navigatorOffline && apiStatus !== "offline") return null;

  return (
    <div
      role="alert"
      className="pointer-events-none fixed inset-x-0 top-2 z-[100] flex justify-center px-3 pt-[max(0.25rem,env(safe-area-inset-top))]"
    >
      <div className="flex max-w-full items-center gap-2 rounded-full border border-warning/40 bg-warning/95 px-3 py-1 text-center text-xs font-semibold text-warning-foreground shadow-md backdrop-blur">
        <WifiOff className="size-3.5 shrink-0" aria-hidden />
        <span className="min-w-0 truncate">
          {i18n.t("offline.banner", {
            defaultValue:
              "Sem conexão com a internet. As mensagens serão enviadas quando a conexão voltar.",
          })}
        </span>
      </div>
    </div>
  );
}
