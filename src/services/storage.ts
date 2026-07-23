import { obfuscate, deobfuscate } from "@/utils/crypto";

export const KEYS = {
  posts: "poston_posts",
  images: "poston_images",
  schedules: "poston_schedules",
  settings: "poston_settings",
  analytics: "poston_analytics",
  publishes: "poston_publishes",
  previewDraft: "poston_preview_draft",
} as const;

export interface PublishRecord {
  id: string;
  contentId: string;
  platform: string;
  publishedAt: string;
  manual: boolean;
}

export interface PreviewDraft {
  id: string;
  text: string;
  hashtags: string[];
  imageUrl?: string;
  createdAt: string;
}

export interface PostRecord {
  id: string;
  content: string;
  platform: string;
  tone: string;
  createdAt: string;
  aiGenerated: boolean;
  hashtags?: string[];
}

export interface ImageRecord {
  id: string;
  url: string;
  prompt: string;
  createdAt: string;
}

export interface ScheduleRecord {
  id: string;
  postId: string;
  platform: string;
  scheduledTime: string;
  status: "pending" | "sent" | "failed";
}

export interface SettingsRecord {
  plan: "free" | "pro";
  postsUsed: number;
  imagesUsed: number;
  lastResetDate: string; // YYYY-MM-DD
  groqKey: string; // obfuscated
  togetherKey: string; // obfuscated
  useOwnKeys: boolean;
}

export interface AnalyticsRecord {
  totalPosts: number;
  totalImages: number;
  totalViews: number;
  platformStats: Record<string, number>;
}

const DEFAULT_SETTINGS: SettingsRecord = {
  plan: "free",
  postsUsed: 0,
  imagesUsed: 0,
  lastResetDate: new Date().toISOString().slice(0, 10),
  groqKey: "",
  togetherKey: "",
  useOwnKeys: true,
};

const DEFAULT_ANALYTICS: AnalyticsRecord = {
  totalPosts: 0,
  totalImages: 0,
  totalViews: 0,
  platformStats: {},
};

function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Posts
export const postsStore = {
  list: (): PostRecord[] => read(KEYS.posts, []),
  add: (p: Omit<PostRecord, "id" | "createdAt">): PostRecord => {
    const rec: PostRecord = { ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    write(KEYS.posts, [rec, ...postsStore.list()]);
    return rec;
  },
  remove: (id: string) => write(KEYS.posts, postsStore.list().filter((p) => p.id !== id)),
};

// Images
export const imagesStore = {
  list: (): ImageRecord[] => read(KEYS.images, []),
  add: (i: Omit<ImageRecord, "id" | "createdAt">): ImageRecord => {
    const rec: ImageRecord = { ...i, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    write(KEYS.images, [rec, ...imagesStore.list()]);
    return rec;
  },
  remove: (id: string) => write(KEYS.images, imagesStore.list().filter((i) => i.id !== id)),
};

// Schedules
export const schedulesStore = {
  list: (): ScheduleRecord[] => read(KEYS.schedules, []),
  add: (s: Omit<ScheduleRecord, "id">): ScheduleRecord => {
    const rec: ScheduleRecord = { ...s, id: crypto.randomUUID() };
    write(KEYS.schedules, [rec, ...schedulesStore.list()]);
    return rec;
  },
  remove: (id: string) => write(KEYS.schedules, schedulesStore.list().filter((s) => s.id !== id)),
};

// Settings
export const settingsStore = {
  get: (): SettingsRecord => ({ ...DEFAULT_SETTINGS, ...read(KEYS.settings, DEFAULT_SETTINGS) }),
  set: (patch: Partial<SettingsRecord>): SettingsRecord => {
    const next = { ...settingsStore.get(), ...patch };
    write(KEYS.settings, next);
    return next;
  },
  getGroqKey: (): string => deobfuscate(settingsStore.get().groqKey),
  setGroqKey: (raw: string) => settingsStore.set({ groqKey: raw ? obfuscate(raw) : "" }),
  getTogetherKey: (): string => deobfuscate(settingsStore.get().togetherKey),
  setTogetherKey: (raw: string) => settingsStore.set({ togetherKey: raw ? obfuscate(raw) : "" }),
};

// Analytics
export const analyticsStore = {
  get: (): AnalyticsRecord => ({ ...DEFAULT_ANALYTICS, ...read(KEYS.analytics, DEFAULT_ANALYTICS) }),
  bumpPost: (platform: string) => {
    const a = analyticsStore.get();
    a.totalPosts += 1;
    a.platformStats[platform] = (a.platformStats[platform] ?? 0) + 1;
    write(KEYS.analytics, a);
  },
  bumpImage: () => {
    const a = analyticsStore.get();
    a.totalImages += 1;
    write(KEYS.analytics, a);
  },
};

export function resetAllStorage() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

export function exportAllStorage(): string {
  const dump: Record<string, unknown> = {};
  Object.entries(KEYS).forEach(([name, key]) => {
    dump[name] = read(key, null);
  });
  return JSON.stringify(dump, null, 2);
}
