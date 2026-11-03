import type { WhatsAppStatus } from "./types";

/** Estados que significam que o número não está apto a receber mensagens. */
export function isConnectionDown(status: WhatsAppStatus): boolean {
  return status === "DISCONNECTED" || status === "TIMEOUT";
}
