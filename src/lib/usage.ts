// Client-side daily usage tracking for free plan limits.
const KEY = "postmind:usage";

export type UsageKind = "post" | "image";

interface UsageData {
  date: string; // YYYY-MM-DD
  post: number;
  image: number;
}

export const LIMITS: Record<"free" | "pro" | "business", { post: number; image: number }> = {
  free: { post: 10, image: 5 },
  pro: { post: Infinity, image: Infinity },
  business: { post: Infinity, image: Infinity },
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function read(): UsageData {
  if (typeof window === "undefined") return { date: today(), post: 0, image: 0 };
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as UsageData) : null;
    if (!parsed || parsed.date !== today()) return { date: today(), post: 0, image: 0 };
    return parsed;
  } catch {
    return { date: today(), post: 0, image: 0 };
  }
}

function write(u: UsageData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(u));
}

export function getUsage() {
  return read();
}

export function canUse(kind: UsageKind, plan: "free" | "pro" | "business"): boolean {
  const limit = LIMITS[plan][kind];
  if (limit === Infinity) return true;
  return read()[kind] < limit;
}

export function bumpUsage(kind: UsageKind) {
  const u = read();
  u[kind] += 1;
  write(u);
}

export function remaining(kind: UsageKind, plan: "free" | "pro" | "business") {
  const limit = LIMITS[plan][kind];
  if (limit === Infinity) return Infinity;
  return Math.max(0, limit - read()[kind]);
}
