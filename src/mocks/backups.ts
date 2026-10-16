import type { RequestOptions } from "@/shared/api/client";

const backups = [
  { id: "2", filename: "backup-2026-10-15.sql", sizeBytes: 48_234_112, status: "completed", createdAt: "2026-10-15T03:00:00Z" },
  { id: "1", filename: "backup-2026-10-14.sql", sizeBytes: 47_901_002, status: "completed", createdAt: "2026-10-14T03:00:00Z" },
];
let schedule = { enabled: true, frequency: "daily", time: "03:00", retention: 7 };

export function backupsMock(path: string, opts: RequestOptions): unknown {
  if (path === "/backups" && opts.method === "POST") {
    const id = String(Date.now());
    const b = { id, filename: `backup-${new Date().toISOString().slice(0, 10)}-${id.slice(-4)}.sql`, sizeBytes: 48_500_000, status: "completed", createdAt: new Date().toISOString() };
    backups.unshift(b);
    return b;
  }
  if (path === "/backups/schedule") {
    schedule = { ...schedule, ...(opts.body as object) };
    return schedule;
  }
  if (path === "/backups/restore") return { ok: true };
  return { backups, schedule };
}
