import { createServerFn } from "@tanstack/react-start";
import { getVapidKeys } from "./vapid.server";

/** Public VAPID key the browser needs to subscribe to reminders (safe to expose). */
export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  const { publicKey } = await getVapidKeys();
  return { publicKey };
});
