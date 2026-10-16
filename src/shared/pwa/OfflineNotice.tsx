import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { i18n } from "@/shared/i18n";

/** Faixa fixa exibida quando o navegador perde a conexão. */
export function OfflineNotice() {
  const [offline, setOffline] = useState(() =>
    typeof navigator === "undefined" ? false : !navigator.onLine,
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;
  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-warning px-3 py-1.5 text-center text-xs font-semibold text-warning-foreground pt-[max(0.375rem,env(safe-area-inset-top))]"
    >
      <WifiOff className="size-3.5" aria-hidden />
      {i18n.t("offline.banner")}
    </div>
  );
}
