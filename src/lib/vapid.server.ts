import { p256 } from "@noble/curves/nist.js";

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/** Derives a stable VAPID key pair from the VAPID_SEED secret (server-only). */
export async function getVapidKeys() {
  const seed = process.env["VAPID_SEED"];
  if (!seed) throw new Error("VAPID_SEED missing");
  const priv = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`poston-vapid:${seed}`)),
  );
  const pub = p256.getPublicKey(priv, false);
  return {
    subject: "mailto:reminders@poston.app",
    publicKey: b64url(pub),
    privateKey: b64url(priv),
  };
}
