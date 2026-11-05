// Browser-only image tools. Every heavy library is loaded with dynamic import()
// inside the function body so nothing runs during SSR.

export type OutputFormat = "png" | "jpeg" | "webp";

export const FORMAT_META: Record<OutputFormat, { label: string; mime: string; ext: string }> = {
  png: { label: "PNG", mime: "image/png", ext: "png" },
  jpeg: { label: "JPG", mime: "image/jpeg", ext: "jpg" },
  webp: { label: "WebP", mime: "image/webp", ext: "webp" },
};

/** Fit (w,h) inside maxSide keeping the ratio; never upscales. */
export function fitSize(w: number, h: number, maxSide: number) {
  if (!maxSide || (w <= maxSide && h <= maxSide)) return { w, h };
  const s = maxSide / Math.max(w, h);
  return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) };
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function baseName(name: string) {
  return name.replace(/\.[^.]+$/, "") || "image";
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("تعذر قراءة الصورة"));
    img.src = src;
  });
}

function drawToCanvas(img: HTMLImageElement, maxSide = 0, fill?: string) {
  const { w, h } = fitSize(img.naturalWidth, img.naturalHeight, maxSide);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas, ctx, w, h };
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("فشل التصدير"))), mime, quality),
  );
}

/** Convert / compress an image between PNG, JPG and WebP. */
export async function convertImage(
  src: string,
  format: OutputFormat,
  opts: { quality?: number; maxSide?: number } = {},
) {
  const img = await loadImage(src);
  // JPG has no transparency → paint white behind it instead of black.
  const fill = format === "jpeg" ? "#ffffff" : undefined;
  const { canvas, w, h } = drawToCanvas(img, opts.maxSide ?? 0, fill);
  const q = format === "png" ? undefined : (opts.quality ?? 0.9);
  const blob = await canvasToBlob(canvas, FORMAT_META[format].mime, q);
  return { blob, width: w, height: h };
}

/* ---------------- Background removal (on-device AI) ---------------- */

// Best quality on devices with a usable GPU (MIT license, ~115 MB, fixed 1024px input).
const GPU_MODEL = "onnx-community/BiRefNet_lite-ONNX";
// Lighter model for CPU-only devices; BiRefNet runs out of WebAssembly memory there
// (Apache-2.0 license, ~44 MB).
const CPU_MODEL = "onnx-community/ormbg-ONNX";

/** Which engine is loaded on this device. */
let bgEngine: "gpu" | "cpu" | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let segmenterPromise: Promise<any> | null = null;

export type ModelProgress = { loaded: number; total: number };

function getSegmenter(onProgress?: (p: ModelProgress) => void, forceCpu = false) {
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");
      env.allowLocalModels = false;
      const files: Record<string, { loaded: number; total: number }> = {};
      const hasGpu = typeof navigator !== "undefined" && "gpu" in navigator;
      const progress_callback = (e: {
        status: string;
        file?: string;
        loaded?: number;
        total?: number;
      }) => {
        if (e.status === "progress" && e.file && e.total) {
          files[e.file] = { loaded: e.loaded ?? 0, total: e.total };
          const all = Object.values(files);
          onProgress?.({
            loaded: all.reduce((a, f) => a + f.loaded, 0),
            total: all.reduce((a, f) => a + f.total, 0),
          });
        }
      };
      const onCpu = async () => {
        bgEngine = "cpu";
        return pipeline("background-removal", CPU_MODEL, {
          device: "wasm",
          dtype: "uint8",
          progress_callback,
        });
      };
      if (!hasGpu || forceCpu) return onCpu();
      try {
        const adapter = await (
          navigator as unknown as { gpu: { requestAdapter: () => Promise<unknown> } }
        ).gpu.requestAdapter();
        if (!adapter) return onCpu();
        const seg = await pipeline("background-removal", GPU_MODEL, {
          device: "webgpu",
          dtype: "fp16",
          progress_callback,
        });
        bgEngine = "gpu";
        return seg;
      } catch {
        // WebGPU can be listed but unusable on some phones → retry on CPU.
        return onCpu();
      }
    })();
    segmenterPromise.catch(() => {
      segmenterPromise = null;
    });
  }
  return segmenterPromise;
}

/** Returns a transparent PNG of the main subject. Runs fully on the device. */
export async function removeBackground(src: string, onProgress?: (p: ModelProgress) => void) {
  const original = await loadImage(src);
  // The model works at 1024px internally; feed a capped copy to save memory.
  const { canvas: input } = drawToCanvas(original, 2048);
  const dataUrl = input.toDataURL("image/png");
  let result;
  try {
    result = await (await getSegmenter(onProgress))(dataUrl);
  } catch (err) {
    if (bgEngine !== "gpu") throw err;
    // GPU loaded but failed while running → switch to the CPU engine once.
    segmenterPromise = null;
    result = await (await getSegmenter(onProgress, true))(dataUrl);
  }
  const raw = Array.isArray(result) ? result[0] : result;
  const blob: Blob = await raw.toBlob("image/png");
  return { blob, width: raw.width as number, height: raw.height as number };
}

/* ---------------- Vectorize to SVG ---------------- */

export type TracePreset = "logo" | "illustration" | "detailed";

export const TRACE_PRESETS: Record<
  TracePreset,
  { label: string; hint: string; colors: number; maxSide: number }
> = {
  logo: { label: "شعار / أيقونة", hint: "ألوان قليلة وحواف نظيفة", colors: 4, maxSide: 600 },
  illustration: { label: "رسم توضيحي", hint: "توازن بين التفاصيل والحجم", colors: 12, maxSide: 800 },
  detailed: { label: "تفاصيل عالية", hint: "ملف أكبر وألوان أكثر", colors: 32, maxSide: 1000 },
};

export async function vectorizeImage(src: string, preset: TracePreset, colors?: number) {
  const mod = await import("imagetracerjs");
  const ImageTracer = (mod as { default?: unknown }).default ?? mod;
  const p = TRACE_PRESETS[preset];
  const img = await loadImage(src);
  const { ctx, w, h } = drawToCanvas(img, p.maxSide);
  const data = ctx.getImageData(0, 0, w, h);
  const svg: string = (ImageTracer as ImageTracerApi).imagedataToSVG(data, {
    numberofcolors: colors ?? p.colors,
    colorsampling: 2,
    ltres: preset === "logo" ? 1 : 0.5,
    qtres: preset === "logo" ? 1 : 0.5,
    pathomit: preset === "detailed" ? 4 : 8,
    blurradius: preset === "logo" ? 1 : 0,
    strokewidth: 0,
    roundcoords: 1,
    viewbox: true,
  });
  const blob = new Blob([svg], { type: "image/svg+xml" });
  return { blob, svg, width: w, height: h };
}

interface ImageTracerApi {
  imagedataToSVG: (data: ImageData, options: Record<string, unknown>) => string;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
