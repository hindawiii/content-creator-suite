import { useCallback, useState } from "react";
import { toast } from "sonner";
import { groqChat } from "@/services/groq";
import { togetherChat } from "@/services/together";
import { settingsStore } from "@/services/storage";
import { detectCTA, shortenCTA, PLATFORM_LIMITS } from "@/utils/platformLimits";
import type { Platform } from "@/lib/store";

async function callChain(userPrompt: string, system?: string): Promise<string> {
  const groqKey = settingsStore.getGroqKey();
  const togetherKey = settingsStore.getTogetherKey();
  if (groqKey) {
    try {
      return await groqChat({ apiKey: groqKey, userPrompt, system, temperature: 0.6 });
    } catch (err) {
      console.warn("Groq resize failed:", err);
    }
  }
  if (togetherKey) {
    try {
      return await togetherChat({ apiKey: togetherKey, userPrompt, system });
    } catch (err) {
      console.warn("Together resize failed:", err);
    }
  }
  throw new Error("no_provider");
}

function stripQuotes(s: string): string {
  return s.trim().replace(/^["'`«»]+|["'`«»]+$/g, "").trim();
}

export function useSmartResize() {
  const [loading, setLoading] = useState(false);

  const shorten = useCallback(async (text: string, platform: Platform): Promise<string | null> => {
    const limit = PLATFORM_LIMITS[platform];
    const { body, cta } = detectCTA(text);
    const shortCTA = cta ? shortenCTA(cta) : null;
    // ميزانية للنص الأساسي = الحد - طول CTA (إن وجد)
    const ctaLen = shortCTA ? shortCTA.length + 2 : 0;
    const budget = Math.max(50, limit - ctaLen - 10);

    const system =
      "You are an Arabic copy editor. Shorten Arabic social posts while preserving the opening HOOK and the voice/tone. Return ONLY the shortened Arabic text, no explanations, no quotes.";
    const prompt = [
      `Shorten this Arabic post to fit ${platform} limit.`,
      `Target length: under ${budget} characters (excluding the CTA line).`,
      `Rules: Keep the HOOK (first line) intact. Remove filler words. Maintain tone. Do NOT add hashtags. Do NOT include the CTA line — I will append it myself.`,
      `Return ONLY the shortened Arabic text.`,
      ``,
      `Post:`,
      cta ? body : text.trim(),
    ].join("\n");

    setLoading(true);
    const toastId = toast.loading("جاري الاختصار الذكي...");
    try {
      const raw = await callChain(prompt, system);
      let shortened = stripQuotes(raw);
      if (shortCTA && !shortened.endsWith(shortCTA)) {
        shortened = shortened.replace(/\s+$/, "") + "\n\n" + shortCTA;
      }
      toast.success("جاهز! قارن النتيجتين", { id: toastId });
      return shortened;
    } catch {
      toast.error("تعذر الاتصال بالذكاء — أضف مفتاح Groq من الإعدادات", { id: toastId });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const expand = useCallback(async (text: string, platform: Platform): Promise<string | null> => {
    const { body, cta } = detectCTA(text);
    const system =
      "You are a viral Arabic content creator. Expand Arabic social posts by adding vivid details, examples, or one micro-story. Keep the opening HOOK and CTA intact. Return ONLY the expanded Arabic text.";
    const prompt = [
      `Expand this Arabic post for ${platform}. Add 2-3 sentences with details or an example.`,
      `Rules: Keep the same HOOK (first line). Keep the same CTA (last line) exactly. Maintain tone. Do NOT add hashtags.`,
      `Return ONLY the expanded Arabic text.`,
      ``,
      `Post:`,
      text.trim(),
    ].join("\n");

    setLoading(true);
    const toastId = toast.loading("جاري التوسيع الذكي...");
    try {
      const raw = await callChain(prompt, system);
      let expanded = stripQuotes(raw);
      // احرص على وجود الـ CTA الأصلي في النهاية
      if (cta && !expanded.includes(cta)) {
        expanded = expanded.replace(/\s+$/, "") + "\n\n" + cta;
      }
      // لا تتجاوز الحد
      const limit = PLATFORM_LIMITS[platform];
      if (expanded.length > limit) expanded = expanded.slice(0, limit - 1).trimEnd() + "…";
      // تأكد فعلياً أنه أطول من الأصلي
      if (expanded.length <= text.length) {
        expanded = text.trim() + "\n\n" + (body ? "" : "") + expanded;
      }
      toast.success("جاهز! قارن النتيجتين", { id: toastId });
      return expanded;
    } catch {
      toast.error("تعذر الاتصال بالذكاء — أضف مفتاح Groq من الإعدادات", { id: toastId });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { shorten, expand, loading };
}
