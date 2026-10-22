/**
 * Converte (remux, sem recodificar) áudio WebM/Opus do MediaRecorder em OGG/Opus,
 * formato nativo de mensagem de voz do WhatsApp. Chrome/Edge não gravam OGG.
 */

const MASTER = new Set([0x18538067, 0x1f43b675, 0x1654ae6b, 0xae, 0xa0, 0xe1]);
const ID_SIMPLE_BLOCK = 0xa3;
const ID_BLOCK = 0xa1;
const ID_CODEC_PRIVATE = 0x63a2;
const ID_CODEC_ID = 0x86;
const ID_CHANNELS = 0x9f;

function vintLength(first: number): number {
  for (let i = 0; i < 8; i++) if (first & (0x80 >> i)) return i + 1;
  return 0;
}

function readId(b: Uint8Array, pos: number) {
  const len = vintLength(b[pos]!);
  if (!len || len > 4 || pos + len > b.length) return null;
  let v = 0;
  for (let i = 0; i < len; i++) v = v * 256 + b[pos + i]!;
  return { value: v, len };
}

function readSize(b: Uint8Array, pos: number) {
  const len = vintLength(b[pos]!);
  if (!len || pos + len > b.length) return null;
  let v = b[pos]! & (0xff >> len);
  let unknown = v === 0xff >> len;
  for (let i = 1; i < len; i++) {
    v = v * 256 + b[pos + i]!;
    if (b[pos + i] !== 0xff) unknown = false;
  }
  return { value: v, len, unknown };
}

/** Amostras a 48 kHz de um pacote Opus (RFC 6716, seção 3.1). */
export function opusPacketSamples(p: Uint8Array): number {
  if (!p.length) return 0;
  const toc = p[0]!;
  const config = toc >> 3;
  let tenthsMs: number;
  if (config < 12) tenthsMs = [100, 200, 400, 600][config & 3]!;
  else if (config < 16) tenthsMs = [100, 200][config & 1]!;
  else tenthsMs = [25, 50, 100, 200][config & 3]!;
  const c = toc & 3;
  const frames = c === 0 ? 1 : c === 3 ? (p[1] ?? 0) & 0x3f : 2;
  return (frames * tenthsMs * 48) / 10;
}

interface Parsed {
  head: Uint8Array | null;
  channels: number;
  packets: Uint8Array[];
  isOpus: boolean;
}

function parseWebm(b: Uint8Array): Parsed {
  const out: Parsed = { head: null, channels: 1, packets: [], isOpus: false };
  let pos = 0;
  while (pos < b.length) {
    const id = readId(b, pos);
    if (!id) break;
    const size = readSize(b, pos + id.len);
    if (!size) break;
    const start = pos + id.len + size.len;
    if (MASTER.has(id.value)) {
      pos = start; // desce nos filhos (suporta tamanho desconhecido)
      continue;
    }
    if (size.unknown) break;
    const end = Math.min(start + size.value, b.length);
    const data = b.subarray(start, end);
    if (id.value === ID_CODEC_ID) {
      out.isOpus = new TextDecoder().decode(data).startsWith("A_OPUS");
    } else if (id.value === ID_CODEC_PRIVATE) {
      out.head = data.slice();
    } else if (id.value === ID_CHANNELS) {
      out.channels = data[0] || 1;
    } else if (id.value === ID_SIMPLE_BLOCK || id.value === ID_BLOCK) {
      const track = readSize(data, 0);
      if (track) {
        const flags = data[track.len + 2] ?? 0;
        // Lacing não é usado pelo MediaRecorder para Opus.
        if ((flags & 0x06) === 0) out.packets.push(data.slice(track.len + 3));
      }
    }
    pos = end;
  }
  return out;
}

let CRC_TABLE: Uint32Array | null = null;
function crc32(data: Uint8Array): number {
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let r = i << 24;
      for (let j = 0; j < 8; j++) r = r & 0x80000000 ? (r << 1) ^ 0x04c11db7 : r << 1;
      CRC_TABLE[i] = r >>> 0;
    }
  }
  let crc = 0;
  for (const byte of data) crc = ((crc << 8) ^ CRC_TABLE[((crc >>> 24) ^ byte) & 0xff]!) >>> 0;
  return crc >>> 0;
}

function oggPage(
  packets: Uint8Array[],
  granule: bigint,
  serial: number,
  seq: number,
  headerType: number,
): Uint8Array {
  const lacing: number[] = [];
  for (const p of packets) {
    let n = p.length;
    while (n >= 255) {
      lacing.push(255);
      n -= 255;
    }
    lacing.push(n);
  }
  const bodyLen = packets.reduce((s, p) => s + p.length, 0);
  const page = new Uint8Array(27 + lacing.length + bodyLen);
  const dv = new DataView(page.buffer);
  page.set([0x4f, 0x67, 0x67, 0x53], 0); // "OggS"
  page[4] = 0;
  page[5] = headerType;
  dv.setBigUint64(6, granule, true);
  dv.setUint32(14, serial, true);
  dv.setUint32(18, seq, true);
  page[26] = lacing.length;
  page.set(lacing, 27);
  let off = 27 + lacing.length;
  for (const p of packets) {
    page.set(p, off);
    off += p.length;
  }
  dv.setUint32(22, crc32(page), true);
  return page;
}

function defaultOpusHead(channels: number): Uint8Array {
  const h = new Uint8Array(19);
  const dv = new DataView(h.buffer);
  h.set(new TextEncoder().encode("OpusHead"), 0);
  h[8] = 1;
  h[9] = channels;
  dv.setUint16(10, 312, true);
  dv.setUint32(12, 48000, true);
  return h;
}

function opusTags(): Uint8Array {
  const vendor = new TextEncoder().encode("ChatbotFlex");
  const t = new Uint8Array(8 + 4 + vendor.length + 4);
  const dv = new DataView(t.buffer);
  t.set(new TextEncoder().encode("OpusTags"), 0);
  dv.setUint32(8, vendor.length, true);
  t.set(vendor, 12);
  return t;
}

/** Retorna os bytes OGG/Opus, ou null se a entrada não for WebM/Opus válido. */
export function webmOpusToOgg(input: Uint8Array): Uint8Array | null {
  const parsed = parseWebm(input);
  if (!parsed.isOpus || !parsed.packets.length) return null;
  const head =
    parsed.head && new TextDecoder().decode(parsed.head.subarray(0, 8)) === "OpusHead"
      ? parsed.head
      : defaultOpusHead(parsed.channels);
  const serial = 0x43464c58;
  const pages: Uint8Array[] = [
    oggPage([head], 0n, serial, 0, 0x02),
    oggPage([opusTags()], 0n, serial, 1, 0),
  ];
  let seq = 2;
  let granule = 0n;
  const PER_PAGE = 50;
  for (let i = 0; i < parsed.packets.length; i += PER_PAGE) {
    const chunk = parsed.packets.slice(i, i + PER_PAGE);
    for (const p of chunk) granule += BigInt(opusPacketSamples(p));
    const last = i + PER_PAGE >= parsed.packets.length;
    pages.push(oggPage(chunk, granule, serial, seq++, last ? 0x04 : 0));
  }
  const total = pages.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of pages) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

/** Converte um arquivo WebM/Opus em OGG/Opus; se não for possível, devolve o original. */
export async function toWhatsappVoice(file: File): Promise<File> {
  if (!file.type.startsWith("audio/webm")) return file;
  try {
    const ogg = webmOpusToOgg(new Uint8Array(await file.arrayBuffer()));
    if (!ogg) return file;
    const name = file.name.replace(/\.webm$/i, "") + ".ogg";
    return new File([ogg as Uint8Array<ArrayBuffer>], name, { type: "audio/ogg" });
  } catch {
    return file;
  }
}
