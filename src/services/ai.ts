// AI abstraction layer — Groq primary, Together fallback, local templates last.
// Keys are read from localStorage (user-provided in Settings) OR VITE_* env vars.

import type { Platform, Tone } from "@/lib/store";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TOGETHER_URL = "https://api.together.xyz/v1/chat/completions";
const KEYS_STORAGE = "postmind:api-keys";

export interface ApiKeys {
  groq?: string;
  together?: string;
}

export function getApiKeys(): ApiKeys {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEYS_STORAGE);
    const stored = raw ? (JSON.parse(raw) as ApiKeys) : {};
    return {
      groq: stored.groq || (import.meta.env.VITE_GROQ_API_KEY as string | undefined),
      together: stored.together || (import.meta.env.VITE_TOGETHER_API_KEY as string | undefined),
    };
  } catch {
    return {};
  }
}

export function setApiKeys(keys: ApiKeys) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS_STORAGE, JSON.stringify(keys));
}

const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  twitter: "Twitter/X",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
};

const TONE_LABEL: Record<Tone, string> = {
  professional: "احترافي",
  friendly: "ودّي",
  humorous: "فكاهي",
  motivational: "تحفيزي",
};

const SYSTEM_PROMPT =
  "You are an expert Arabic content marketer. Write engaging, concise social media posts suitable for the requested platform. Use emojis moderately. End with an interactive question. Do not repeat yourself.";

async function chatCompletion(
  url: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 500,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty response");
  return content;
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastErr;
}

async function callAI(messages: { role: string; content: string }[]): Promise<{ text: string; provider: string }> {
  const keys = getApiKeys();

  if (keys.groq) {
    try {
      const text = await withRetry(() => chatCompletion(GROQ_URL, keys.groq!, "llama3-8b-8192", messages));
      return { text, provider: "groq" };
    } catch (e) {
      console.warn("[AI] Groq failed:", e);
    }
  }
  if (keys.together) {
    try {
      const text = await withRetry(() =>
        chatCompletion(TOGETHER_URL, keys.together!, "meta-llama/Llama-3-8B-Instruct-Turbo", messages),
      );
      return { text, provider: "together" };
    } catch (e) {
      console.warn("[AI] Together failed:", e);
    }
  }
  throw new Error("NO_PROVIDER");
}

// ---------- Local fallback templates ----------

const LOCAL_TEMPLATES: Record<Tone, string> = {
  professional:
    "في عالم يتطور كل يوم، {topic} لم يعد رفاهية بل ضرورة.\n\n1️⃣ الاستراتيجية أهم من الأدوات\n2️⃣ البيانات تُحدث الفرق\n3️⃣ الاستمرارية هي المفتاح\n\nما رأيك؟ شاركنا في التعليقات 👇",
  friendly:
    "يا جماعة! 👋\n\nتعالوا نتكلم عن {topic} بصراحة…\n\nصدقوني، لو طبقتوا هذي الفكرة الصغيرة، راح تتغير أمور كثيرة ✨\n\nمين جرّب قبل؟ 💬",
  humorous:
    "أنا: راح أتعلم {topic} اليوم! 💪\nأنا بعد 5 دقائق: ليش الحياة صعبة؟ 😅\n\nبس جدياً — الأمر أسهل مما تتوقعون 🎯 مين معي؟",
  motivational:
    "لا تنتظر اللحظة المثالية.\n\n{topic} يبدأ بخطوة واحدة صغيرة اليوم — وليس غداً.\n\n🔥 كل خبير كان مبتدئاً.\n🔥 كل قصة نجاح بدأت بقرار.\n\nابدأ الآن. ✨ متى تبدأ؟",
};

const LOCAL_HASHTAGS = [
  "#تسويق_رقمي",
  "#صناعة_محتوى",
  "#ريادة_أعمال",
  "#سوشيال_ميديا",
  "#نمو",
  "#إبداع",
  "#محتوى_عربي",
  "#PostMind",
  "#تسويق",
  "#محتوى",
  "#marketing",
  "#content",
  "#socialmedia",
  "#growth",
  "#branding",
];

function localPost(topic: string, tone: Tone, platform: Platform) {
  const body = LOCAL_TEMPLATES[tone].replace(/\{topic\}/g, topic || "الموضوع");
  const tags = LOCAL_HASHTAGS.slice(0, platform === "twitter" ? 3 : 6).join(" ");
  return `${body}\n\n${tags}`;
}

// ---------- Public API ----------

export interface GeneratePostInput {
  topic: string;
  platform: Platform;
  tone: Tone;
  audience?: string;
}

export interface GenerateResult {
  text: string;
  provider: "groq" | "together" | "local";
}

export async function generatePost(input: GeneratePostInput): Promise<GenerateResult> {
  const { topic, platform, tone, audience } = input;
  const userPrompt = `اكتب منشوراً لمنصة ${PLATFORM_LABEL[platform]} بنبرة ${TONE_LABEL[tone]}.
الموضوع: ${topic}
${audience ? `الجمهور المستهدف: ${audience}` : ""}

المطلوب:
- محتوى جذاب ومختصر مناسب لطبيعة ${PLATFORM_LABEL[platform]}
- استخدم الإيموجي باعتدال
- انتهِ بسؤال تفاعلي
- أضف 6-10 هاشتاغات مناسبة في النهاية (${platform === "twitter" ? "3 فقط لتويتر" : ""})
- لا تكرر نفسك، لا تضف مقدمات مثل "إليك المنشور"

اكتب المنشور مباشرة:`;

  try {
    const { text, provider } = await callAI([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ]);
    return { text, provider: provider as "groq" | "together" };
  } catch {
    return { text: localPost(topic, tone, platform), provider: "local" };
  }
}

export type RewriteMode = "rewrite" | "shorten" | "expand" | "cta";

const REWRITE_INSTRUCTIONS: Record<RewriteMode, string> = {
  rewrite: "أعد صياغة النص التالي بأسلوب مختلف تماماً مع الحفاظ على المعنى والهاشتاغات.",
  shorten: "اختصر النص التالي إلى نصف طوله تقريباً مع الحفاظ على الجوهر والهاشتاغات.",
  expand: "وسّع النص التالي وأضف تفاصيل مفيدة وأمثلة، مع الحفاظ على الأسلوب والهاشتاغات.",
  cta: "أضف Call-to-Action قوي وواضح في نهاية النص التالي (قبل الهاشتاغات) يحفّز المتابع على التفاعل أو الشراء أو المتابعة.",
};

export async function rewritePost(text: string, mode: RewriteMode, tone?: Tone): Promise<GenerateResult> {
  const instruction = REWRITE_INSTRUCTIONS[mode];
  const toneNote = tone && mode === "rewrite" ? `\nاستخدم نبرة ${TONE_LABEL[tone]}.` : "";
  try {
    const { text: out, provider } = await callAI([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `${instruction}${toneNote}\n\nاكتب النتيجة مباشرة بدون مقدمات:\n\n${text}` },
    ]);
    return { text: out, provider: provider as "groq" | "together" };
  } catch {
    // Local fallbacks
    if (mode === "shorten") {
      const lines = text.split("\n").filter(Boolean);
      return { text: lines.slice(0, Math.max(2, Math.ceil(lines.length / 2))).join("\n"), provider: "local" };
    }
    if (mode === "cta") {
      return { text: text + "\n\n👇 شاركنا رأيك في التعليقات وتابعنا للمزيد!", provider: "local" };
    }
    return { text, provider: "local" };
  }
}

export async function suggestHashtags(topic: string, platform: Platform): Promise<string[]> {
  const prompt = `اقترح 15 هاشتاغاً مناسباً لمنصة ${PLATFORM_LABEL[platform]} حول الموضوع التالي: "${topic}".
- اخلط بين العربي والإنجليزي.
- رتّبها من الأكثر ملاءمة إلى الأقل.
- أعد فقط قائمة الهاشتاغات مفصولة بمسافات، بدون شرح أو ترقيم.`;
  try {
    const { text } = await callAI([
      { role: "system", content: "You suggest social-media hashtags. Reply with hashtags only, space-separated." },
      { role: "user", content: prompt },
    ]);
    const tags = text
      .split(/\s+/)
      .map((t) => t.replace(/^[,،.]+|[,،.]+$/g, ""))
      .filter((t) => t.startsWith("#"))
      .slice(0, 15);
    return tags.length ? tags : LOCAL_HASHTAGS;
  } catch {
    return LOCAL_HASHTAGS;
  }
}

// ---------- Images: Pollinations ----------

export interface PollinationsImage {
  url: string;
  seed: number;
}

export function buildPollinationsUrls(prompt: string, width: number, height: number, count = 4): PollinationsImage[] {
  const enhanced = `${prompt}, social media post, professional design, modern style`;
  const encoded = encodeURIComponent(enhanced);
  return Array.from({ length: count }).map(() => {
    const seed = Math.floor(Math.random() * 1_000_000);
    return {
      seed,
      url: `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nologo=true`,
    };
  });
}
