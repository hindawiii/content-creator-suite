export const SYSTEM_PROMPT =
  "You are an expert Arabic content marketer. Write engaging, concise social media posts suitable for the requested platform. Use emojis moderately. End with an interactive question. Do not repeat yourself.";

export function buildPostPrompt(opts: {
  topic: string;
  platform: string;
  tone: string;
  audience?: string;
}): string {
  const { topic, platform, tone, audience } = opts;
  return [
    `اكتب منشوراً لمنصة ${platform} بنبرة ${tone}.`,
    `الموضوع: ${topic}.`,
    audience ? `الجمهور المستهدف: ${audience}.` : "",
    "أعد الرد على شكل JSON فقط بالصيغة التالية بدون أي شرح إضافي:",
    `{"content":"<النص الكامل للمنشور بالعربية>","hashtags":["#tag1","#tag2", "... 10-15 هاشتاق مناسب"]}`,
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
