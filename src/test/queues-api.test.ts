import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/errors";
import { apiRequest } from "@/shared/api/client";
import { createQueue, updateQueue } from "@/modules/queues/api";
import { queueErrorKey } from "@/modules/queues/contract";

vi.mock("@/shared/api/client", () => ({ apiRequest: vi.fn() }));
const request = vi.mocked(apiRequest);
const input = { name: " Suporte ", color: "#2563EB", greetingMessage: " Olá " };

describe("queue server contract", () => {
  beforeEach(() => request.mockReset());

  it("creates with required router defaults", async () => {
    request.mockResolvedValue({ id: 4 });
    await createQueue(input);
    expect(request).toHaveBeenCalledWith("/queue", {
      method: "POST",
      body: {
        name: "Suporte", color: "#2563EB", greetingMessage: "Olá",
        ativarRoteador: false, tempoRoteador: 0, orderQueue: null,
        outOfHoursMessage: "", schedules: [], integrationId: null,
        fileListId: null, closeTicket: false,
      },
    });
  });

  it("preserves existing hidden settings and does not send companyId or chatbot replacements", async () => {
    const schedules = [{ weekday: "monday", startTime: "09:00" }];
    request.mockResolvedValueOnce({ id: 8, companyId: 2, chatbots: [{ id: 9 }],
      ativarRoteador: true, tempoRoteador: 30, orderQueue: 2, schedules,
      outOfHoursMessage: "Fechado", integrationId: 7, fileListId: 3, closeTicket: true });
    request.mockResolvedValueOnce({ id: 8 });
    await updateQueue(8, input);
    expect(request).toHaveBeenNthCalledWith(1, "/queue/8");
    expect(request).toHaveBeenNthCalledWith(2, "/queue/8", { method: "PUT", body: {
      name: "Suporte", color: "#2563EB", greetingMessage: "Olá",
      ativarRoteador: true, tempoRoteador: 30, orderQueue: 2, schedules,
      outOfHoursMessage: "Fechado", integrationId: 7, fileListId: 3, closeTicket: true,
    } });
  });

  it("does not overwrite the queue if the detail cannot be read", async () => {
    const denied = new ApiError("forbidden", 403);
    request.mockRejectedValueOnce(denied);
    let caught: unknown;
    try {
      await updateQueue(8, input);
    } catch (error) {
      caught = error;
    }
    expect(caught).toBe(denied);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("recognizes the backend plan limit in its error field", () => {
    const error = new ApiError("validation", 400, { error: "Número máximo de filas já alcançado: 3" } as { message?: string });
    expect(queueErrorKey(error)).toBe("queues.form.limitReached");
  });

  it("distinguishes invalid and duplicate colors", () => {
    expect(queueErrorKey(new ApiError("validation", 400, { message: "ERR_QUEUE_INVALID_COLOR" }))).toBe("queues.form.colorInvalid");
    expect(queueErrorKey(new ApiError("validation", 400, { code: "ERR_QUEUE_COLOR_ALREADY_EXISTS" }))).toBe("queues.form.colorTaken");
  });
});