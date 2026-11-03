async function readHeader(file: File, length: number): Promise<Uint8Array> {
  const header = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("File read failed"));
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) resolve(reader.result);
      else reject(new Error("Unexpected file header"));
    };
    reader.readAsArrayBuffer(file.slice(0, length));
  });
  return new Uint8Array(header);
}

/** Identify PDFs by their bytes, not the extension or the browser's MIME guess. */
export async function normalizePdfFile(file: File): Promise<File> {
  const bytes = await readHeader(file, 5);
  if (![37, 80, 68, 70, 45].every((byte, index) => bytes[index] === byte)) return file;
  const name = /\.pdf$/i.test(file.name) ? file.name : `${file.name.replace(/\.bin$/i, "")}.pdf`;
  if (name === file.name && file.type === "application/pdf") return file;
  return new File([file], name, { type: "application/pdf", lastModified: file.lastModified });
}

const matches = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((byte, index) => bytes[offset + index] === byte);

function safeUploadName(name: string, extension?: string): string {
  const dot = name.lastIndexOf(".");
  const currentExtension = dot > 0 ? name.slice(dot + 1) : "";
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  const ext = (extension ?? currentExtension).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return `${base || "arquivo"}${ext ? `.${ext}` : ""}`;
}

/**
 * Normaliza imagens pelo conteúdo e remove caracteres de nome que costumam
 * ser rejeitados por storage/provedores. PDFs continuam usando a regra acima.
 */
export async function normalizeUploadFile(file: File): Promise<File> {
  const pdf = await normalizePdfFile(file);
  if (pdf.type === "application/pdf") {
    const name = safeUploadName(pdf.name, "pdf");
    return name === pdf.name
      ? pdf
      : new File([pdf], name, { type: pdf.type, lastModified: pdf.lastModified });
  }

  const bytes = await readHeader(file, 12);
  let detected: { type: string; extension: string } | undefined;
  if (matches(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    detected = { type: "image/png", extension: "png" };
  else if (matches(bytes, [0xff, 0xd8, 0xff])) detected = { type: "image/jpeg", extension: "jpg" };
  else if (matches(bytes, [0x47, 0x49, 0x46, 0x38]))
    detected = { type: "image/gif", extension: "gif" };
  else if (matches(bytes, [0x52, 0x49, 0x46, 0x46]) && matches(bytes, [0x57, 0x45, 0x42, 0x50], 8))
    detected = { type: "image/webp", extension: "webp" };

  const name = safeUploadName(file.name, detected?.extension);
  const type = detected?.type ?? file.type;
  if (name === file.name && type === file.type) return file;
  return new File([file], name, { type, lastModified: file.lastModified });
}
