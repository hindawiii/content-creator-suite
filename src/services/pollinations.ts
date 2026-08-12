const BASE = "https://image.pollinations.ai/prompt";

const STYLE_SUFFIX =
  "high quality photograph, professional social media visual, cinematic lighting, sharp details, no text, no letters, no watermark, no logo";

export function enhancePrompt(prompt: string): string {
  const clean = prompt.replace(/\s+/g, " ").trim();
  return clean.includes(STYLE_SUFFIX) ? clean : `${clean}, ${STYLE_SUFFIX}`;
}

export function pollinationsUrl(prompt: string, opts: { seed: number; width?: number; height?: number }): string {
  const w = opts.width ?? 1024;
  const h = opts.height ?? 1024;
  return `${BASE}/${encodeURIComponent(enhancePrompt(prompt))}?width=${w}&height=${h}&seed=${opts.seed}&nologo=true&model=flux&enhance=true`;
}

export function pollinationsBatch(prompt: string, count = 4, dims?: { width: number; height: number }): { url: string; seed: number }[] {
  return Array.from({ length: count }).map((_, i) => {
    // Vary the seed widely so the 4 results differ but all follow the prompt.
    const seed = Math.floor(Math.random() * 100000) + i * 137;
    return { seed, url: pollinationsUrl(prompt, { seed, ...(dims ?? {}) }) };
  });
}
