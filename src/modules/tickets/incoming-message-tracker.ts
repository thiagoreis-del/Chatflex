import type { Message } from "./types";

/** One tracker per session, shared by Socket and polling. */
export class IncomingMessageTracker {
  private seen = new Set<string>();

  constructor(private readonly startedAt: number) {}

  accept(message: Message): boolean {
    const createdAt = Date.parse(message.createdAt);
    if (
      !message.id || message.fromMe !== false || message.isPrivate ||
      !Number.isFinite(createdAt) || createdAt <= this.startedAt
    ) return false;
    const key = `${message.ticketId}:${message.id}`;
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    if (this.seen.size > 5000) {
      const first = this.seen.values().next().value;
      if (first) this.seen.delete(first);
    }
    return true;
  }
}