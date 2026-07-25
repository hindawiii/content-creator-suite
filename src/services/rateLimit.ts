import { settingsStore } from "./storage";

const LIMITS = {
  free: { posts: 10, images: 5 },
  pro: { posts: Infinity, images: Infinity },
} as const;

function today(): string {
  // Local-timezone day key — resets at user's midnight, not UTC
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function resetIfNeeded() {
  const s = settingsStore.get();
  if (s.lastResetDate !== today()) {
    settingsStore.set({ postsUsed: 0, imagesUsed: 0, lastResetDate: today() });
  }
}

export function getQuota(): { plan: "free" | "pro"; posts: { used: number; max: number }; images: { used: number; max: number } } {
  resetIfNeeded();
  const s = settingsStore.get();
  const limit = LIMITS[s.plan];
  return {
    plan: s.plan,
    posts: { used: s.postsUsed, max: limit.posts },
    images: { used: s.imagesUsed, max: limit.images },
  };
}

export function canGenerate(kind: "post" | "image"): boolean {
  resetIfNeeded();
  const q = getQuota();
  return kind === "post" ? q.posts.used < q.posts.max : q.images.used < q.images.max;
}

export function consume(kind: "post" | "image") {
  resetIfNeeded();
  const s = settingsStore.get();
  if (kind === "post") settingsStore.set({ postsUsed: s.postsUsed + 1 });
  else settingsStore.set({ imagesUsed: s.imagesUsed + 1 });
}
