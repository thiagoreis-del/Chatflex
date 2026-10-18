/** Browser-only CSPRNG; rejection sampling avoids modulo bias. */
export function generatePassword(length = 16): string {
  if (!Number.isInteger(length) || length < 8 || length > 128) {
    throw new RangeError("Invalid password length");
  }
  const groups = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnpqrstuvwxyz", "23456789", "@#$%&*"];
  const chars = groups.join("");
  const randomIndex = (size: number) => {
    const limit = 256 - (256 % size);
    const byte = new Uint8Array(1);
    do { globalThis.crypto.getRandomValues(byte); } while ((byte[0] ?? 256) >= limit);
    return (byte[0] ?? 0) % size;
  };
  const result = groups.map((group) => group.charAt(randomIndex(group.length)));
  while (result.length < length) result.push(chars.charAt(randomIndex(chars.length)));
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    const current = result[i] ?? "";
    result[i] = result[j] ?? "";
    result[j] = current;
  }
  return result.join("");
}