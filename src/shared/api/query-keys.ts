/** Chaves do TanStack Query centralizadas. */
export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: () => ["auth", "me"] as const,
  },
} as const;
