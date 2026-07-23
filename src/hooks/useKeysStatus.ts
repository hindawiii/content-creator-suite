import { useEffect, useState, useCallback } from "react";
import { settingsStore } from "@/services/storage";

export type KeysHealth = "ok" | "none" | "failed";

const EVENT = "poston:keys-changed";

export function emitKeysChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

export function useKeysStatus() {
  const [state, setState] = useState<{ hasGroq: boolean; hasTogether: boolean; health: KeysHealth }>({
    hasGroq: false,
    hasTogether: false,
    health: "none",
  });

  const refresh = useCallback(() => {
    const groq = settingsStore.getGroqKey();
    const together = settingsStore.getTogetherKey();
    const savedHealth = (typeof localStorage !== "undefined" && localStorage.getItem("poston_keys_health")) as KeysHealth | null;
    const hasAny = Boolean(groq || together);
    setState({
      hasGroq: Boolean(groq),
      hasTogether: Boolean(together),
      health: !hasAny ? "none" : savedHealth === "failed" ? "failed" : "ok",
    });
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  return state;
}

export function setKeysHealth(h: KeysHealth) {
  if (typeof localStorage !== "undefined") localStorage.setItem("poston_keys_health", h);
  emitKeysChanged();
}
