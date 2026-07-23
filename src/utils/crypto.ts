// Simple obfuscation for API keys stored in localStorage.
// NOT real encryption — a client-side app can never truly hide secrets from its user.
const SALT = "poston:v1:xor";

export function obfuscate(value: string): string {
  if (!value) return "";
  let out = "";
  for (let i = 0; i < value.length; i++) {
    out += String.fromCharCode(value.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length));
  }
  // base64 (browser)
  return typeof btoa !== "undefined" ? btoa(unescape(encodeURIComponent(out))) : out;
}

export function deobfuscate(value: string): string {
  if (!value) return "";
  try {
    const raw = typeof atob !== "undefined" ? decodeURIComponent(escape(atob(value))) : value;
    let out = "";
    for (let i = 0; i < raw.length; i++) {
      out += String.fromCharCode(raw.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length));
    }
    return out;
  } catch {
    return "";
  }
}
