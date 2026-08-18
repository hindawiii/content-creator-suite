import { useCallback, useState } from "react";
import { toast } from "sonner";
import { groqChat } from "@/services/groq";
import { togetherChat } from "@/services/together";
import { pollinationsBatch, ANIME_SUFFIX } from "@/services/pollinations";
import { geminiImage } from "@/services/gemini";
import { puterImage } from "@/services/puter";
import { settingsStore } from "@/services/storage";
import { canGenerate, consume } from "@/services/rateLimit";
import { FALLBACK_CHAIN, findModel, routeModel, DEFAULT_TEXT_MODEL, type Task } from "@/services/models";
import { buildHashtagPrompt, buildPostPrompt, buildRewritePrompt, buildImagePromptRequest } from "@/utils/prompts";
import { localFallback } from "@/utils/fallbacks";
import type { Platform, Tone, Dialect } from "@/lib/store";

async function runModel(modelId: string, userPrompt: string, system: string | undefined): Promise<string> {
  const model = findModel(modelId);
  const provider = model?.provider ?? "groq";
  if (provider === "together") {
    const key = settingsStore.getTogetherKey();
    if (!key) throw new Error("missing_together_key");
    return togetherChat({ apiKey: key, userPrompt, system, model: modelId });
  }
  const key = settingsStore.getGroqKey();
  if (!key) throw new Error("missing_groq_key");
  return groqChat({ apiKey: key, userPrompt, system, model: modelId });
}

/**
 * Smart router + fallback chain: selected model → Llama 3.3 70B → Llama 3.1 8B → Together.
 */
async function callChain(
  userPrompt: string,
  system?: string,
  task: Task = "post",
): Promise<{ text: string; source: "groq" | "together" | "fallback"; model: string }> {
  const preferred = settingsStore.get().textModel || DEFAULT_TEXT_MODEL;
  const primary = routeModel(task, preferred);
  const chain = [primary, ...FALLBACK_CHAIN.filter((m) => m !== primary)];

  for (let i = 0; i < chain.length; i++) {
    const modelId = chain[i];
    try {
      const text = await runModel(modelId, userPrompt, system);
      settingsStore.bumpModel(modelId);
      return { text, source: findModel(modelId)?.provider === "together" ? "together" : "groq", model: modelId };
    } catch (err) {
      console.warn(`model ${modelId} failed:`, err);
      if (i < chain.length - 1) toast.message("جاري التبديل إلى موديل احتياطي...");
    }
  }

  // Last resort: Together AI default model
  const togetherKey = settingsStore.getTogetherKey();
  if (togetherKey) {
    try {
      const text = await togetherChat({ apiKey: togetherKey, userPrompt, system });
      return { text, source: "together", model: "together-default" };
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
    async (opts: { topic: string; platform: Platform; tone: Tone; audience?: string; dialect?: Dialect }): Promise<
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
        // Do NOT consume quota when AI providers failed — user gets local template only
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
    if (!canGenerate("hashtag")) {
      toast.error("تم استهلاك الحصة اليومية — قم بالترقية للخطة Pro");
      return [];
    }
    setLoading(true);
    const toastId = toast.loading("جاري توليد الهاشتاقات...");
    try {
      const { text } = await callChain(buildHashtagPrompt(topic), undefined, "hashtag");
      const tags = text
        .split(/[,\n]/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.startsWith("#") ? t : `#${t.replace(/\s+/g, "_")}`))
        .slice(0, 15);
      consume("hashtag");
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
      const { text } = await callChain(buildRewritePrompt(kind, content, differentTone), undefined, "rewrite");
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

export interface ImageGenOptions {
  width?: number;
  height?: number;
  anime?: boolean;
  styleModifier?: string;
  referenceUrl?: string;
  provider?: "pollinations" | "gemini" | "puter";
  count?: number;
}

/** Translate an Arabic prompt to English — image models understand English far better. */
async function toEnglishPrompt(prompt: string): Promise<string> {
  const clean = prompt.trim();
  if (!/[\u0600-\u06FF]/.test(clean)) return clean;
  try {
    const { text } = await callChain(
      buildImagePromptRequest(clean),
      "You are a concise text-to-image prompt engineer. Reply with the English prompt only.",
      "translate",
    );
    const cleaned = text.replace(/^["'\s]+|["'\s]+$/g, "").split("\n")[0].trim();
    if (cleaned && /[a-zA-Z]/.test(cleaned)) return cleaned.slice(0, 400);
  } catch {
    // keep the original prompt if translation fails
  }
  return clean;
}

export function useImageGenerator() {
  const [loading, setLoading] = useState(false);
  const generate = useCallback(
    async (prompt: string, opts?: ImageGenOptions) => {
      if (!canGenerate("image")) {
        toast.error("تم استهلاك حصة الصور اليومية — قم بالترقية للخطة Pro");
        return [];
      }
      const settings = settingsStore.get();
      const provider = opts?.provider ?? settings.imageProvider ?? "pollinations";
      const anime = opts?.anime ?? settings.animeMode;
      setLoading(true);
      const toastId = toast.loading("جاري تحسين الوصف وتوليد الصور...");

      try {
        const finalPrompt = await toEnglishPrompt(prompt);

        // BYOK providers return a single image each
        if (provider === "gemini" || provider === "puter") {
          const styled = [finalPrompt, opts?.styleModifier, anime ? ANIME_SUFFIX : ""].filter(Boolean).join(", ");
          try {
            const url =
              provider === "gemini"
                ? await geminiImage({ apiKey: settingsStore.getGeminiKey(), prompt: styled })
                : await puterImage(styled);
            consume("image");
            toast.success("تم توليد الصورة", { id: toastId });
            return [{ url, seed: 0 }];
          } catch (err) {
            console.warn(`${provider} image failed:`, err);
            toast.message("تعذر المزوّد المختار — جاري التبديل إلى Pollinations (مجاني)...");
          }
        }

        const batch = pollinationsBatch(finalPrompt, opts?.count ?? 4, 
          opts?.width && opts?.height ? { width: opts.width, height: opts.height } : undefined,
          { anime, styleModifier: opts?.styleModifier, referenceUrl: opts?.referenceUrl },
        );
        // Wait for the images to actually load before clearing the spinner
        await Promise.all(
          batch.map(
            (b) =>
              new Promise<void>((resolve) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => resolve();
                img.src = b.url;
              }),
          ),
        );
        consume("image");
        toast.success("تم توليد الصور", { id: toastId });
        return batch;
      } catch (err) {
        console.warn("image generation failed:", err);
        toast.error("تعذر توليد الصور — حاول مرة أخرى", { id: toastId });
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );
  return { generate, loading };
}


