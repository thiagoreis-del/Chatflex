import { describe, expect, it } from "vitest";
import { isSilentRecording, samplePeak } from "@/modules/tickets/audio-level";

describe("detecção de áudio sem som", () => {
  it("bloqueia gravação só com ruído de fundo", () => {
    expect(isSilentRecording(samplePeak([0.002, -0.004, 0.003]))).toBe(true);
  });

  it("permite gravação com voz", () => {
    expect(isSilentRecording(samplePeak([0.01, -0.35, 0.2]))).toBe(false);
  });

  it("não bloqueia quando não foi possível medir", () => {
    expect(isSilentRecording(null)).toBe(false);
  });
});
