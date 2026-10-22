/**
 * Gera as barras da forma de onda de um áudio (estilo WhatsApp).
 * Cada barra é a amplitude máxima de um trecho do sinal, normalizada de 0 a 1.
 */

export const WAVEFORM_BARS = 40;

/** Reduz as amplitudes do sinal para `bars` barras, normalizadas (0–1). */
export function downsamplePeaks(samples: ArrayLike<number>, bars: number): number[] {
  if (bars <= 0 || samples.length === 0) return [];
  const bucket = samples.length / bars;
  const peaks: number[] = [];
  let max = 0;
  for (let i = 0; i < bars; i++) {
    const start = Math.floor(i * bucket);
    const end = Math.max(start + 1, Math.floor((i + 1) * bucket));
    let peak = 0;
    for (let j = start; j < end && j < samples.length; j++) {
      const v = Math.abs(samples[j] ?? 0);
      if (v > peak) peak = v;
    }
    peaks.push(peak);
    if (peak > max) max = peak;
  }
  if (max === 0) return peaks.map(() => 0);
  return peaks.map((p) => Math.max(0.12, p / max));
}

/**
 * Forma de onda de reserva quando não dá para decodificar o áudio
 * (CORS, formato não suportado). Determinística a partir da URL,
 * para o mesmo áudio sempre mostrar a mesma forma.
 */
export function fallbackWaveform(seed: string, bars: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    const v = ((h >>> 0) % 1000) / 1000;
    out.push(0.25 + v * 0.75);
  }
  return out;
}

/** mm:ss para a duração/posição do áudio. */
export function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
