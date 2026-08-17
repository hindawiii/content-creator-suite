const BASE = "https://image.pollinations.ai/prompt";
const VIDEO_BASE = "https://video.pollinations.ai/prompt";

const STYLE_SUFFIX =
  "high quality photograph, professional social media visual, cinematic lighting, sharp details, no text, no letters, no watermark, no logo";

export const ANIME_SUFFIX = "anime style, studio ghibli, cel shaded, vibrant colors, detailed illustration";

export interface StylePreset {
  key: string;
  label: string;
  modifier: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  { key: "vangogh", label: "🎨 فان جوخ زيتي", modifier: "in the style of Van Gogh oil painting, thick expressive brush strokes, swirling impasto texture" },
  { key: "cyberpunk", label: "🌆 سايبربنك نيون", modifier: "cyberpunk neon aesthetic, glowing magenta and cyan lights, rainy futuristic city mood, high contrast" },
  { key: "anime-sketch", label: "✏️ رسم أنمي", modifier: "anime sketch, clean line art, manga inking, soft screentone shading" },
  { key: "watercolor", label: "💧 ألوان مائية", modifier: "watercolor painting, soft bleeding pigments, textured paper, delicate washes" },
  { key: "pixel", label: "🕹️ بكسل آرت", modifier: "pixel art, 16-bit retro game sprite, limited palette, crisp pixels" },
];

export function enhancePrompt(prompt: string, opts?: { anime?: boolean; styleModifier?: string }): string {
  const clean = prompt.replace(/\s+/g, " ").trim();
  const parts = [clean];
  if (opts?.styleModifier) parts.push(opts.styleModifier);
  if (opts?.anime) parts.push(ANIME_SUFFIX);
  else if (!opts?.styleModifier) parts.push(STYLE_SUFFIX);
  else parts.push("no text, no letters, no watermark, no logo");
  return parts.join(", ");
}

export interface ImageOptions {
  seed: number;
  width?: number;
  height?: number;
  anime?: boolean;
  styleModifier?: string;
  /** Public URL of a reference image → enables image-to-image (kontext model). */
  referenceUrl?: string;
}

export function pollinationsUrl(prompt: string, opts: ImageOptions): string {
  const w = opts.width ?? 1024;
  const h = opts.height ?? 1024;
  const model = opts.referenceUrl ? "kontext" : "flux";
  const ref = opts.referenceUrl ? `&image=${encodeURIComponent(opts.referenceUrl)}` : "";
  const text = enhancePrompt(prompt, { anime: opts.anime, styleModifier: opts.styleModifier });
  return `${BASE}/${encodeURIComponent(text)}?width=${w}&height=${h}&seed=${opts.seed}&nologo=true&model=${model}&enhance=true${ref}`;
}

export function pollinationsBatch(
  prompt: string,
  count = 4,
  dims?: { width: number; height: number },
  extra?: { anime?: boolean; styleModifier?: string; referenceUrl?: string },
): { url: string; seed: number }[] {
  return Array.from({ length: count }).map((_, i) => {
    // Vary the seed widely so the results differ but all follow the prompt.
    const seed = Math.floor(Math.random() * 100000) + i * 137;
    return { seed, url: pollinationsUrl(prompt, { seed, ...(dims ?? {}), ...(extra ?? {}) }) };
  });
}

/** Prompt-engineering fallback for style transfer when the reference is a local upload (no public URL). */
export function buildStyleTransferPrompt(target: string, referenceDesc: string): string {
  return `Apply the style of ${referenceDesc} to ${target}. Keep composition but change colors, texture, and artistic style.`;
}

/**
 * Pollinations Video (Alpha). Requires Pollen credits or a Pollinations key.
 * Returns a blob URL for the generated MP4.
 */
export async function pollinationsVideo(opts: {
  prompt: string;
  token?: string;
  imageUrl?: string;
  aspect?: "16:9" | "9:16" | "1:1";
}): Promise<string> {
  const params = new URLSearchParams({ model: "veo", aspect: opts.aspect ?? "16:9" });
  if (opts.imageUrl) params.set("image", opts.imageUrl);
  if (opts.token) params.set("token", opts.token);
  const res = await fetch(`${VIDEO_BASE}/${encodeURIComponent(opts.prompt)}?${params.toString()}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 402 || res.status === 403) throw new Error("video_needs_credits");
    throw new Error(`video_${res.status}:${body.slice(0, 120)}`);
  }
  const blob = await res.blob();
  if (!blob.type.startsWith("video")) throw new Error("video_needs_credits");
  return URL.createObjectURL(blob);
}
