import { queryOptions } from "@tanstack/react-query";
import { apiDownload, apiRequest } from "@/shared/api/client";
import { backupEndpoints } from "@/shared/config/endpoints";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = { [k: string]: any };
export type BackupStatus = "pending" | "running" | "completed" | "failed";
export type BackupFrequency = "daily" | "weekly" | "monthly";

export interface Backup {
  id: string;
  filename: string;
  sizeBytes: number | null;
  status: BackupStatus;
  createdAt: string | null;
  error?: string | null;
}

export interface BackupSchedule {
  enabled: boolean;
  frequency: BackupFrequency;
  time: string;
  retention: number;
}

export interface BackupOverview {
  backups: Backup[];
  schedule: BackupSchedule;
}

const defaultSchedule: BackupSchedule = {
  enabled: false,
  frequency: "daily",
  time: "03:00",
  retention: 7,
};

function normalizeStatus(v: unknown): BackupStatus {
  const s = String(v ?? "").toLowerCase();
  if (["running", "processing", "in_progress"].includes(s)) return "running";
  if (["pending", "queued"].includes(s)) return "pending";
  if (["failed", "error"].includes(s)) return "failed";
  return "completed";
}

function normalizeBackup(raw: Loose): Backup {
  const size = raw["sizeBytes"] ?? raw["size"] ?? raw["fileSize"];
  return {
    id: String(raw["id"] ?? raw["filename"] ?? raw["name"] ?? ""),
    filename: String(
      raw["filename"] ?? raw["fileName"] ?? raw["name"] ?? `backup-${raw["id"] ?? ""}`,
    ),
    sizeBytes: typeof size === "number" ? size : size ? Number(size) || null : null,
    status: normalizeStatus(raw["status"]),
    createdAt: (raw["createdAt"] ?? raw["created_at"] ?? raw["date"] ?? null) as string | null,
    error: (raw["error"] ?? raw["errorMessage"] ?? null) as string | null,
  };
}

/** Aceita array puro, { backups }, { data } e agendamento em { schedule }. */
function normalizeOverview(res: unknown): BackupOverview {
  const obj = (res ?? {}) as Loose;
  const list = Array.isArray(res)
    ? res
    : Array.isArray(obj["backups"])
      ? obj["backups"]
      : Array.isArray(obj["data"])
        ? obj["data"]
        : [];
  const sch = (obj["schedule"] ?? {}) as Partial<BackupSchedule>;
  return {
    backups: (list as Loose[]).map(normalizeBackup),
    schedule: { ...defaultSchedule, ...sch },
  };
}

export const backupsQuery = () =>
  queryOptions({
    queryKey: ["backups"],
    queryFn: async () => normalizeOverview(await apiRequest<unknown>(backupEndpoints.list)),
    refetchInterval: (q) =>
      q.state.data?.backups.some((b) => b.status === "running" || b.status === "pending")
        ? 5000
        : false,
  });

export const createBackup = () => apiRequest<unknown>(backupEndpoints.list, { method: "POST" });

export const restoreBackup = (backupId: string) =>
  apiRequest<unknown>(backupEndpoints.restore, { method: "POST", body: { backupId } });

export const saveBackupSchedule = (schedule: BackupSchedule) =>
  apiRequest<unknown>(backupEndpoints.schedule, { method: "PUT", body: schedule });

export async function downloadBackup(backup: Backup) {
  const { blob, filename } = await apiDownload(backupEndpoints.download(backup.id));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? backup.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
