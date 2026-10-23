/** Calendar days use the viewer's local timezone, just like message times. */
export function messageDayKey(iso: string): string | null {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function messageDateLabel(
  iso: string,
  labels: { today: string; yesterday: string },
  now = new Date(),
  locale = "pt-BR",
): string | null {
  const day = messageDayKey(iso);
  if (!day) return null;
  if (day === messageDayKey(now.toISOString())) return labels.today;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (day === messageDayKey(yesterday.toISOString())) return labels.yesterday;
  return new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(new Date(iso));
}

export function startsMessageDay(iso: string, previous?: string): boolean {
  const day = messageDayKey(iso);
  return day !== null && day !== (previous ? messageDayKey(previous) : null);
}