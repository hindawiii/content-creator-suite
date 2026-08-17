export type Provider = "groq" | "together";
export type BadgeTone = "free" | "fast" | "arabic" | "anime" | "credits";

export interface TextModel {
  id: string;
  provider: Provider;
  label: string;
  desc: string;
  badges: BadgeTone[];
}

/** Free-tier text models. Groq = free key, Together = free/cheap key. */
export const TEXT_MODELS: TextModel[] = [
  {
    id: "llama-3.1-8b-instant",
    provider: "groq",
    label: "Llama 3.1 8B",
    desc: "سريع — للهاشتاقات والنصوص القصيرة",
    badges: ["free", "fast"],
  },
  {
    id: "llama-3.3-70b-versatile",
    provider: "groq",
    label: "Llama 3.3 70B",
    desc: "متوازن — الأفضل للمنشورات العربية",
    badges: ["free", "arabic"],
  },
  {
    id: "moonshotai/kimi-k2-instruct",
    provider: "groq",
    label: "Kimi K2",
    desc: "إبداعي — العربية واللهجة السودانية",
    badges: ["free", "arabic"],
  },
  {
    id: "qwen/qwen3-32b",
    provider: "groq",
    label: "Qwen 3 32B",
    desc: "الترجمة ووصف الصور",
    badges: ["free", "fast"],
  },
  {
    id: "deepseek-ai/DeepSeek-V3",
    provider: "together",
    label: "DeepSeek V3",
    desc: "سرد طويل وقصص — عبر Together AI",
    badges: ["arabic"],
  },
];

export const DEFAULT_TEXT_MODEL = "llama-3.3-70b-versatile";

/** Ordered fallback chain used when the selected model fails. */
export const FALLBACK_CHAIN = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

export function findModel(id: string): TextModel | undefined {
  return TEXT_MODELS.find((m) => m.id === id);
}

export type Task = "post" | "hashtag" | "rewrite" | "translate";

/** Smart router — picks the best model per task, respecting the user's choice for posts. */
export function routeModel(task: Task, preferred: string): string {
  switch (task) {
    case "hashtag":
      return "llama-3.1-8b-instant";
    case "translate":
      return "qwen/qwen3-32b";
    case "rewrite":
      return preferred === "deepseek-ai/DeepSeek-V3" ? preferred : "llama-3.3-70b-versatile";
    case "post":
    default:
      return preferred || DEFAULT_TEXT_MODEL;
  }
}

export const BADGE_LABEL: Record<BadgeTone, { text: string; tone: "success" | "accent" | "warning" | "default" }> = {
  free: { text: "مجاني", tone: "success" },
  fast: { text: "سريع", tone: "accent" },
  arabic: { text: "عربي", tone: "accent" },
  anime: { text: "أنمي", tone: "accent" },
  credits: { text: "يحتاج رصيد", tone: "warning" },
};
