/** Cores de um atendente: classes utilitárias para selo, texto e ponto colorido. */
export interface AttendantBadgeColor {
  badge: string;
  text: string;
  dot: string;
}

const PALETTE: AttendantBadgeColor[] = [
  { badge: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30", text: "text-sky-700 dark:text-sky-300", dot: "bg-sky-500" },
  { badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  { badge: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30", text: "text-violet-700 dark:text-violet-300", dot: "bg-violet-500" },
  { badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  { badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30", text: "text-rose-700 dark:text-rose-300", dot: "bg-rose-500" },
  { badge: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30", text: "text-teal-700 dark:text-teal-300", dot: "bg-teal-500" },
  { badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30", text: "text-indigo-700 dark:text-indigo-300", dot: "bg-indigo-500" },
  { badge: "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30", text: "text-orange-700 dark:text-orange-300", dot: "bg-orange-500" },
];

/** Cor estável para um atendente: preferência pelo id; sem id, deriva do nome. */
export function attendantBadgeColor(user?: { id?: number | null; name?: string | null }): AttendantBadgeColor {
  const key = user?.id ?? user?.name;
  if (key == null || key === "") return PALETTE[0];
  let hash = 0;
  const source = String(key);
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
