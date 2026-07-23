import { useCallback, useState } from "react";
import { toast } from "sonner";
import { groqChat } from "@/services/groq";
import { togetherChat } from "@/services/together";
import { pollinationsBatch } from "@/services/pollinations";
import { settingsStore } from "@/services/storage";
import { canGenerate, consume } from "@/services/rateLimit";
import { buildHashtagPrompt, buildPostPrompt, buildRewritePrompt } from "@/utils/prompts";
import { localFallback } from "@/utils/fallbacks";
import type { Platform, Tone } from "@/lib/store";

async function callChain(userPrompt: string, system?: string): Promise<{ text: string; source: "groq" | "together" | "fallback" }> {
  const groqKey = settingsStore.getGroqKey();
  const togetherKey = settingsStore.getTogetherKey();

  // Groq with one retry
  if (groqKey) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const text = await groqChat({ apiKey: groqKey, userPrompt, system });
        return { text, source: "groq" };
      } catch (err) {
        if (attempt === 0) continue;
        console.warn("Groq failed:", err);
        toast.message("تم تفعيل الاحتياطي — Together AI");
      }
    }
  }

  // Together fallback
  if (togetherKey) {
    try {
      const text = await togetherChat({ apiKey: togetherKey, userPrompt, system });
      return { text, source: "together" };
    } catch (err) {
      console.warn("Together failed:", err);
    }
  }

  throw new Error("all_providers_failed");
}

function tryParseJson(text: string): { content: string; hashtags: string[] } | null {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    if (typeof parsed?.content === "string" && Array.isArray(parsed?.hashtags)) {
      return { content: parsed.content, hashtags: parsed.hashtags.map(String) };
    }
    return null;
  } catch {
    return null;
  }
}

export function usePostGenerator() {
  const [loading, setLoading] = useState(false);

  const generate = useCallback(
    async (opts: { topic: string; platform: Platform; tone: Tone; audience?: string }): Promise<
      { content: string; hashtags: string[]; source: "groq" | "together" | "fallback" }
    > => {
      if (!canGenerate("post")) {
        toast.error("تم استهلاك الحصة اليومية — قم بالترقية للخطة Pro");
        throw new Error("quota_exceeded");
      }
      setLoading(true);
      const toastId = toast.loading("جاري توليد المنشور...");
      try {
        const userPrompt = buildPostPrompt(opts);
        const { text, source } = await callChain(userPrompt);
        const parsed = tryParseJson(text);
        const result = parsed ?? { content: text.trim(), hashtags: localFallback(opts.topic, opts.tone, opts.platform).hashtags };
        consume("post");
        toast.success("تم التوليد بنجاح", { id: toastId });
        return { ...result, source };
      } catch (err) {
        const fb = localFallback(opts.topic, opts.tone, opts.platform);
        toast.error("تعذر الاتصال بمزودي الذكاء — استُخدم القالب المحلي", { id: toastId });
        consume("post");
        return { ...fb, source: "fallback" };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { generate, loading };
}

export function useHashtags() {
  const [loading, setLoading] = useState(false);
  const suggest = useCallback(async (topic: string): Promise<string[]> => {
    setLoading(true);
    const toastId = toast.loading("جاري توليد الهاشتاقات...");
    try {
      const { text } = await callChain(buildHashtagPrompt(topic));
      const tags = text
        .split(/[,\n]/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.startsWith("#") ? t : `#${t.replace(/\s+/g, "_")}`))
        .slice(0, 15);
      toast.success("جاهزة!", { id: toastId });
      return tags;
    } catch {
      toast.error("تعذر توليد الهاشتاقات — استُخدمت قائمة محلية", { id: toastId });
      return ["#تسويق_رقمي","#محتوى_عربي","#سوشيال_ميديا","#نمو","#إبداع"];
    } finally {
      setLoading(false);
    }
  }, []);
  return { suggest, loading };
}

export function useRewrite() {
  const [loading, setLoading] = useState(false);
  const run = useCallback(async (kind: "rewrite" | "shorten" | "expand" | "cta", content: string, differentTone?: string): Promise<string> => {
    setLoading(true);
    const toastId = toast.loading("جاري التعديل...");
    try {
      const { text } = await callChain(buildRewritePrompt(kind, content, differentTone));
      toast.success("تم!", { id: toastId });
      return text.trim();
    } catch {
      toast.error("تعذر الاتصال — تم الإبقاء على النص الأصلي", { id: toastId });
      return content;
    } finally {
      setLoading(false);
    }
  }, []);
  return { run, loading };
}

export function useImageGenerator() {
  const [loading, setLoading] = useState(false);
  const generate = useCallback(
    (prompt: string, dims?: { width: number; height: number }) => {
      if (!canGenerate("image")) {
        toast.error("تم استهلاك حصة الصور اليومية — قم بالترقية للخطة Pro");
        return [];
      }
      setLoading(true);
      const batch = pollinationsBatch(prompt, 4, dims);
      consume("image");
      // Loading is visual only — <img> tags handle load state
      setTimeout(() => setLoading(false), 300);
      return batch;
    },
    [],
  );
  return { generate, loading };
}
