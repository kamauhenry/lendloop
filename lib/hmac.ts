const enc = new TextEncoder();

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sign(payload: string, secret: string): Promise<string> {
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return toHex(sig);
}

export async function verify(
  payload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const expected = await sign(payload, secret);
  // Constant-time comparison via timingSafeEqual unavailable in Edge runtime — use length check first
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}
