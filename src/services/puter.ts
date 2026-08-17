/**
 * Puter.js — user-pays media generation (the end user signs into their own Puter account).
 * Loaded lazily from CDN so it never blocks the app.
 */
declare global {
  interface Window {
    puter?: {
      ai: {
        txt2img: (prompt: string, testMode?: boolean) => Promise<HTMLImageElement | string>;
        txt2vid?: (prompt: string) => Promise<{ url?: string } | string>;
      };
    };
  }
}

let loading: Promise<void> | null = null;

export function loadPuter(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no_window"));
  if (window.puter) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://js.puter.com/v2/";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("puter_load_failed"));
    document.head.appendChild(s);
  });
  return loading;
}

export async function puterImage(prompt: string): Promise<string> {
  await loadPuter();
  const out = await window.puter!.ai.txt2img(prompt);
  if (typeof out === "string") return out;
  return out.src;
}

export async function puterVideo(prompt: string): Promise<string> {
  await loadPuter();
  const fn = window.puter!.ai.txt2vid;
  if (!fn) throw new Error("puter_video_unavailable");
  const out = await fn(prompt);
  if (typeof out === "string") return out;
  if (out?.url) return out.url;
  throw new Error("puter_video_unavailable");
}
