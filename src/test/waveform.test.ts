import { describe, expect, it } from "vitest";
import {
  WAVEFORM_BARS,
  downsamplePeaks,
  fallbackWaveform,
  formatAudioTime,
} from "@/modules/tickets/waveform";

describe("downsamplePeaks", () => {
  it("reduz o sinal para o número de barras pedido, normalizado de 0 a 1", () => {
    const samples = new Float32Array(4000);
    for (let i = 0; i < samples.length; i++) {
      samples[i] = Math.sin(i / 20) * (i < 2000 ? 0.3 : 0.9);
    }
    const bars = downsamplePeaks(samples, WAVEFORM_BARS);
    expect(bars).toHaveLength(WAVEFORM_BARS);
    expect(Math.max(...bars)).toBe(1);
    expect(Math.min(...bars)).toBeGreaterThanOrEqual(0.12);
    // A segunda metade (mais alta) deve ter barras maiores que a primeira.
    const first = bars.slice(0, 20).reduce((a, b) => a + b, 0);
    const second = bars.slice(20).reduce((a, b) => a + b, 0);
    expect(second).toBeGreaterThan(first);
  });

  it("devolve vazio para entrada vazia", () => {
    expect(downsamplePeaks([], 40)).toEqual([]);
  });

  it("áudio silencioso vira barras zeradas (sem dividir por zero)", () => {
    expect(downsamplePeaks(new Float32Array(100), 10)).toEqual(new Array(10).fill(0));
  });
});

describe("fallbackWaveform", () => {
  it("é determinística para a mesma URL e varia entre URLs", () => {
    const a1 = fallbackWaveform("https://x/a.ogg", 40);
    const a2 = fallbackWaveform("https://x/a.ogg", 40);
    const b = fallbackWaveform("https://x/b.ogg", 40);
    expect(a1).toEqual(a2);
    expect(a1).not.toEqual(b);
    expect(a1).toHaveLength(40);
    for (const v of a1) {
      expect(v).toBeGreaterThanOrEqual(0.25);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe("formatAudioTime", () => {
  it("formata segundos como m:ss", () => {
    expect(formatAudioTime(0)).toBe("0:00");
    expect(formatAudioTime(3)).toBe("0:03");
    expect(formatAudioTime(65)).toBe("1:05");
    expect(formatAudioTime(Number.NaN)).toBe("0:00");
  });
});
