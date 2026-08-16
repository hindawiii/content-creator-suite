import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Platform = "instagram" | "twitter" | "facebook" | "linkedin" | "tiktok" | "youtube" | "whatsapp" | "telegram";
export type Tone = "youthful" | "powerful" | "professional" | "humorous" | "dramatic" | "calm" | "friendly" | "motivational";

export interface Post {
  id: string;
  content: string;
  platform: Platform;
  tone: Tone;
  topic: string;
  createdAt: string;
  scheduledAt?: string;
  status: "draft" | "scheduled" | "published";
  engagement?: { likes: number; comments: number; shares: number; views: number };
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  aspectRatio: "1:1" | "9:16" | "16:9" | "4:5";
  url: string;
  createdAt: string;
}

interface StoreState {
  posts: Post[];
  images: GeneratedImage[];
  connectedAccounts: Partial<Record<Platform, boolean>>;
  plan: "free" | "pro" | "business";
  addPost: (p: Omit<Post, "id" | "createdAt">) => Post;
  updatePost: (id: string, patch: Partial<Post>) => void;
  removePost: (id: string) => void;
  addImage: (i: Omit<GeneratedImage, "id" | "createdAt">) => GeneratedImage;
  removeImage: (id: string) => void;
  toggleAccount: (p: Platform) => void;
  setPlan: (p: "free" | "pro" | "business") => void;
}

const StoreCtx = createContext<StoreState | null>(null);
const KEY = "postmind:v1";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [connectedAccounts, setConnected] = useState<Partial<Record<Platform, boolean>>>({});
  const [plan, setPlan] = useState<"free" | "pro" | "business">("free");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        // Drop legacy demo/seed records so the app only shows real user data.
        const clean: Post[] = (s.posts ?? []).filter((p: Post) => !String(p.id).startsWith("seed-"));
        setPosts(clean);
        setImages(s.images ?? []);
        setConnected(s.connectedAccounts ?? {});
        setPlan(s.plan ?? "free");
      }
    } catch {
      setPosts([]);
    }
    setHydrated(true);
  }, []);


  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify({ posts, images, connectedAccounts, plan }));
  }, [posts, images, connectedAccounts, plan, hydrated]);

  const value: StoreState = {
    posts, images, connectedAccounts, plan,
    addPost: (p) => {
      const post: Post = { ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      setPosts((prev) => [post, ...prev]);
      return post;
    },
    updatePost: (id, patch) => setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    removePost: (id) => setPosts((prev) => prev.filter((p) => p.id !== id)),
    addImage: (i) => {
      const img: GeneratedImage = { ...i, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
      setImages((prev) => [img, ...prev]);
      return img;
    },
    removeImage: (id) => setImages((prev) => prev.filter((i) => i.id !== id)),
    toggleAccount: (p) => setConnected((prev) => ({ ...prev, [p]: !prev[p] })),
    setPlan,
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export const PLATFORM_META: Record<Platform, { label: string; color: string; emoji: string }> = {
  instagram: { label: "انستقرام", color: "#E1306C", emoji: "📷" },
  twitter: { label: "تويتر / X", color: "#1DA1F2", emoji: "🐦" },
  facebook: { label: "فيسبوك", color: "#1877F2", emoji: "👥" },
  linkedin: { label: "لينكدإن", color: "#0A66C2", emoji: "💼" },
  tiktok: { label: "تيك توك", color: "#ff0050", emoji: "🎵" },
  youtube: { label: "يوتيوب", color: "#FF0000", emoji: "▶️" },
  whatsapp: { label: "واتساب", color: "#25D366", emoji: "💬" },
  telegram: { label: "تلغرام", color: "#0088cc", emoji: "✈️" },
};

export const TONE_META: Record<Tone, string> = {
  youthful: "شبابي",
  powerful: "قوي وحماسي",
  professional: "احترافي",
  humorous: "فكاهي",
  dramatic: "درامي",
  calm: "مسالم",
  friendly: "ودّي",
  motivational: "تحفيزي",
};

export type Dialect = "msa" | "sudanese" | "egyptian" | "gulf" | "levantine" | "maghrebi";

export const DIALECT_META: Record<Dialect, { label: string; emoji: string; hint: string }> = {
  msa: { label: "الفصحى (البيضاء)", emoji: "🕊️", hint: "عربية فصحى مبسطة مفهومة لكل العرب، بلا مفردات محلية" },
  sudanese: { label: "سودانية", emoji: "🇸🇩", hint: "لهجة سودانية أصيلة" },
  egyptian: { label: "مصرية", emoji: "🇪🇬", hint: "لهجة مصرية عامية خفيفة" },
  gulf: { label: "خليجية", emoji: "🇸🇦", hint: "لهجة خليجية" },
  levantine: { label: "شامية", emoji: "🇸🇾", hint: "لهجة شامية" },
  maghrebi: { label: "مغاربية", emoji: "🇲🇦", hint: "لهجة مغاربية مفهومة" },
};
