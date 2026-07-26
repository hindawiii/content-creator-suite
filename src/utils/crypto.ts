// Simple obfuscation for API keys stored in localStorage.
// NOT real encryption — a client-side app can never truly hide secrets from its user.
const SALT = "poston:v1:xor";

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return typeof btoa !== "undefined" ? btoa(bin) : bin;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = typeof atob !== "undefined" ? atob(b64) : b64;
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function obfuscate(value: string): string {
  if (!value) return "";
  const data = new TextEncoder().encode(value);
  const saltBytes = new TextEncoder().encode(SALT);
  const xored = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) xored[i] = data[i] ^ saltBytes[i % saltBytes.length];
  return bytesToBase64(xored);
}

export function deobfuscate(value: string): string {
  if (!value) return "";
  try {
    const bytes = base64ToBytes(value);
    const saltBytes = new TextEncoder().encode(SALT);
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ saltBytes[i % saltBytes.length];
    return new TextDecoder().decode(out);
  } catch {
    return "";
  }
}

