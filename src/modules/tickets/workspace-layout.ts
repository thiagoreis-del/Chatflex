import { useEffect, useState } from "react";
import type { Layout, LayoutChangedMeta } from "react-resizable-panels";

export const TICKET_LAYOUT_KEY = "chatflex:tickets:workspace-layout:v1";
export const DEFAULT_TICKET_LAYOUT: Layout = { list: 35, conversation: 65 };

/** Browser preferences contain geometry only, never session or conversation data. */
export function parseTicketLayout(raw: string | null): Layout | undefined {
  if (!raw) return undefined;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return undefined;
    const { list, conversation } = value as Record<string, unknown>;
    if (
      typeof list !== "number" || !Number.isFinite(list) || list < 25 || list > 60 ||
      typeof conversation !== "number" || !Number.isFinite(conversation) ||
      Math.abs(list + conversation - 100) > 0.01
    ) return undefined;
    return { list, conversation };
  } catch {
    return undefined;
  }
}

export function saveTicketLayout(layout: Layout, meta: LayoutChangedMeta): void {
  if (!meta.isUserInteraction || !parseTicketLayout(JSON.stringify(layout))) return;
  try {
    window.localStorage.setItem(TICKET_LAYOUT_KEY, JSON.stringify(layout));
  } catch {
    // Resizing must continue working when browser storage is disabled or full.
  }
}

export function useTicketWorkspaceLayout() {
  const [desktop, setDesktop] = useState(false);
  const [layout, setLayout] = useState(DEFAULT_TICKET_LAYOUT);
  useEffect(() => {
    try {
      setLayout(parseTicketLayout(window.localStorage.getItem(TICKET_LAYOUT_KEY)) ?? DEFAULT_TICKET_LAYOUT);
    } catch {
      // Keep the default without preventing access to the workspace.
    }
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return { desktop, layout, onLayoutChanged: saveTicketLayout };
}