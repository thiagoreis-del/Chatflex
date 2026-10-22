import { describe, expect, it } from "vitest";
import { opusPacketSamples, webmOpusToOgg } from "@/modules/tickets/webm-to-ogg";

function el(id: number[], body: Uint8Array | number[], unknown = false): number[] {
  const b = Array.from(body);
  const size = unknown ? [0x01, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff] : [0x10, 0, 0, b.length];
  return [...id, ...size, ...b];
}

function sampleWebm(frames: number): Uint8Array {
  const codec = el([0x86], Array.from(new TextEncoder().encode("A_OPUS")));
  const track = el([0x16, 0x54, 0xae, 0x6b], el([0xae], codec));
  const blocks: number[] = [];
  // TOC 0xF8: config 31 (20 ms CELT), 1 frame = 960 amostras.
  for (let i = 0; i < frames; i++) blocks.push(...el([0xa3], [0x81, 0, i, 0x80, 0xf8, 1, 2, 3]));
  const cluster = el([0x1f, 0x43, 0xb6, 0x75], [...el([0xe7], [0]), ...blocks], true);
  return new Uint8Array(el([0x18, 0x53, 0x80, 0x67], [...track, ...cluster], true));
}

describe("webmOpusToOgg", () => {
  it("20 ms CELT packet has 960 samples", () => {
    expect(opusPacketSamples(new Uint8Array([0xf8]))).toBe(960);
  });

  it("produces OGG with OpusHead and final granule equal to total samples", () => {
    const ogg = webmOpusToOgg(sampleWebm(3))!;
    expect(ogg).not.toBeNull();
    const txt = new TextDecoder("latin1").decode(ogg);
    expect(txt.startsWith("OggS")).toBe(true);
    expect(txt).toContain("OpusHead");
    expect(txt).toContain("OpusTags");
    const last = txt.lastIndexOf("OggS");
    const dv = new DataView(ogg.buffer, ogg.byteOffset + last);
    expect(ogg[last + 5]).toBe(0x04);
    expect(dv.getBigUint64(6, true)).toBe(2880n);
  });

  it("returns null for non-Opus input", () => {
    expect(webmOpusToOgg(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});
