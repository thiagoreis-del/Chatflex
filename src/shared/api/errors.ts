export type ApiErrorKind =
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "conflict"
  | "validation"
  | "rateLimited"
  | "server"
  | "network"
  | "aborted"
  | "unknown";

export interface ApiErrorBody {
  message?: string;
  code?: string;
  errors?: Record<string, string[] | string>;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly body?: ApiErrorBody;

  constructor(kind: ApiErrorKind, status: number, body?: ApiErrorBody) {
    super(body?.message ?? kind);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.body = body;
  }

  /** Chave de tradução no namespace `errors`. */
  get messageKey(): string {
    return `api.${this.kind}`;
  }
}

export function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "notFound";
  if (status === 409) return "conflict";
  if (status === 422 || status === 400) return "validation";
  if (status === 429) return "rateLimited";
  if (status >= 500) return "server";
  return "unknown";
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
