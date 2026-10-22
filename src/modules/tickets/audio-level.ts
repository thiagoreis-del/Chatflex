/**
 * Detecção de gravação sem som (microfone mudo, desligado ou dispositivo errado).
 * Pico abaixo de ~-40 dBFS durante toda a gravação = só ruído de fundo.
 */
export const SILENCE_PEAK_THRESHOLD = 0.01;

/** Pico absoluto de um trecho de amostras (-1 a 1). */
export function samplePeak(samples: ArrayLike<number>): number {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = Math.abs(samples[i] ?? 0);
    if (v > peak) peak = v;
  }
  return peak;
}

/** `null` = não foi possível medir (não bloqueia o envio). */
export function isSilentRecording(maxPeak: number | null): boolean {
  return maxPeak !== null && maxPeak < SILENCE_PEAK_THRESHOLD;
}
