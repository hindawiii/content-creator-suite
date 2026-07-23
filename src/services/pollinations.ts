const BASE = "https://image.pollinations.ai/prompt";

export function enhancePrompt(prompt: string): string {
  const suffix = "social media post, professional design, Arabic text, modern style";
  return prompt.includes(suffix) ? prompt : `${prompt}, ${suffix}`;
}

export function pollinationsUrl(prompt: string, opts: { seed: number; width?: number; height?: number }): string {
  const w = opts.width ?? 1024;
  const h = opts.height ?? 1024;
  return `${BASE}/${encodeURIComponent(enhancePrompt(prompt))}?width=${w}&height=${h}&seed=${opts.seed}&nologo=true`;
}

export function pollinationsBatch(prompt: string, count = 4, dims?: { width: number; height: number }): { url: string; seed: number }[] {
  return Array.from({ length: count }).map((_, i) => {
    const seed = i + 1;
    return { seed, url: pollinationsUrl(prompt, { seed, ...(dims ?? {}) }) };
  });
}
