/** Identify PDFs by their bytes, not the extension or the browser's MIME guess. */
export async function normalizePdfFile(file: File): Promise<File> {
  const header = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("File read failed"));
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) resolve(reader.result);
      else reject(new Error("Unexpected file header"));
    };
    reader.readAsArrayBuffer(file.slice(0, 5));
  });
  const bytes = new Uint8Array(header);
  if (![37, 80, 68, 70, 45].every((byte, index) => bytes[index] === byte)) return file;
  const name = /\.pdf$/i.test(file.name)
    ? file.name
    : `${file.name.replace(/\.bin$/i, "")}.pdf`;
  if (name === file.name && file.type === "application/pdf") return file;
  return new File([file], name, { type: "application/pdf", lastModified: file.lastModified });
}