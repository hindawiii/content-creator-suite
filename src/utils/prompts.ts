export const SYSTEM_PROMPT =
  "You are a viral Arabic content creator. Write in a youthful, energetic style (شبابي) unless the requested tone says otherwise. Open with a strong hook in the first line. Use power words. Add strategic emojis. End with a clear call-to-action (CTA). Keep it punchy, shareable, and human — write as if talking to a friend, not a robot. Never repeat yourself.";

const TONE_HINTS: Record<string, string> = {
  youthful: "شبابي، طاقة عالية، لغة عامية خفيفة، جُمل قصيرة",
  powerful: "قوي، حماسي، تحفيزي، عبارات ضربات قوية",
  professional: "احترافي، هادئ، مبني على قيمة واضحة",
  humorous: "فكاهي، خفيف الظل، مع مفاجأة في النهاية",
  dramatic: "درامي، سرد قصصي، جملة أولى تشدّ القارئ",
  calm: "مسالم، هادئ، تأمّلي، بلا ضجيج",
  friendly: "ودّي، قريب من القارئ، كأنك تحكي مع صديق",
  motivational: "تحفيزي، إيجابي، يحث على الفعل الآن",
};

const CTA_LIBRARY = [
  "شاركنا رأيك 👇",
  "اضغط لايك إذا وافقت ❤️",
  "تابعنا للمزيد 🔔",
  "تاق صديق يحتاج يسمع هذا 👥",
  "احفظ المنشور للمراجعة 📌",
  "اكتب لنا في التعليقات 💬",
];

export function buildPostPrompt(opts: {
  topic: string;
  platform: string;
  tone: string;
  audience?: string;
  cta?: string;
}): string {
  const { topic, platform, tone, audience, cta } = opts;
  const toneHint = TONE_HINTS[tone] ?? tone;
  const ctaLine = cta
    ? `استخدم هذا الـ CTA حرفياً في النهاية: "${cta}".`
    : `اختر CTA مناسباً من: ${CTA_LIBRARY.join(" | ")}.`;
  return [
    `اكتب منشوراً لمنصة ${platform} بنبرة ${tone} (${toneHint}).`,
    `الموضوع: ${topic}.`,
    audience ? `الجمهور المستهدف: ${audience}.` : "",
    "الصيغة المطلوبة:",
    "- السطر الأول: HOOK قوي يشدّ الانتباه فوراً.",
    "- المتن: 2-3 فقرات قصيرة، جُمل قصيرة، إيموجي موضعي.",
    "- النهاية: CTA واضح على سطر مستقل.",
    ctaLine,
    "أعد الرد على شكل JSON فقط بدون أي شرح إضافي:",
    `{"content":"<النص الكامل للمنشور بالعربية مع HOOK ومتن وCTA>","hashtags":["#tag1","#tag2", "... 10-15 هاشتاق مزيج عربي/إنجليزي"]}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildHashtagPrompt(topic: string): string {
  return `Suggest 15 relevant hashtags in Arabic and English for: ${topic}. Sort by relevance. Return as comma-separated list.`;
}

export function buildRewritePrompt(kind: "rewrite" | "shorten" | "expand" | "cta", content: string, differentTone?: string): string {
  switch (kind) {
    case "rewrite":
      return `Rewrite this post in a ${differentTone ?? "different"} tone: ${content}`;
    case "shorten":
      return `Make this post shorter (under 100 words): ${content}`;
    case "expand":
      return `Expand this post with more details: ${content}`;
    case "cta":
      return `Add a strong call-to-action to this post: ${content}`;
  }
}

export const CTA_OPTIONS = CTA_LIBRARY;
