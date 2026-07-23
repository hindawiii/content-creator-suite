import { useCallback, useEffect, useState } from "react";
import { canGenerate, consume, getQuota } from "@/services/rateLimit";

export function useQuota() {
  const [quota, setQuota] = useState(() => getQuota());
  const refresh = useCallback(() => setQuota(getQuota()), []);
  useEffect(() => {
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);
  return { quota, refresh };
}

export function useCanGenerate() {
  return { canGenerate, consume };
}
