import type { Platform } from "@/lib/store";

export const PLATFORM_LIMITS: Record<Platform, number> = {
  twitter: 280,
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  tiktok: 2200,
  youtube: 5000,
  whatsapp: 65536,
  telegram: 4096,
};

// [min, max] عدد الأحرف المثالي للتفاعل
export const SWEET_SPOTS: Partial<Record<Platform, [number, number]>> = {
  twitter: [200, 260],
  instagram: [150, 400],
  linkedin: [300, 800],
  facebook: [100, 500],
  tiktok: [100, 300],
  youtube: [200, 500],
};

export type SweetStatus = "ideal" | "short" | "long" | "over";

export function sweetStatus(text: string, p: Platform): SweetStatus {
  const len = text.length;
  const max = PLATFORM_LIMITS[p];
  if (len > max) return "over";
  const range = SWEET_SPOTS[p];
  if (!range) return len <= max ? "ideal" : "over";
  if (len < range[0]) return "short";
  if (len > range[1]) return "long";
  return "ideal";
}

// كشف السطر الأخير كـ CTA (يبدأ بكلمات دلالية)
const CTA_STARTERS = [
  "شاركنا","شارك","تابعنا","تابع","اضغط","احفظ","اكتب","علّق","علق","تاق","تاغ",
  "انقر","سجّل","سجل","اطلب","حمّل","حمل","اشترك","زور","زوروا","لا تفوّت","لا تفوت",
];

export function detectCTA(text: string): { body: string; cta: string | null } {
  const lines = text.trim().split(/\r?\n/);
  // ابحث من النهاية عن أول سطر غير فارغ
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    // تجاهل سطور الهاشتاقات
    if (/^#\S/.test(line) || /^(#\S+\s*)+$/.test(line)) continue;
    const clean = line.replace(/^[^\p{L}\p{N}]+/u, "");
    if (CTA_STARTERS.some((s) => clean.startsWith(s))) {
      const body = lines.slice(0, i).join("\n").trimEnd();
      return { body, cta: line };
    }
    break;
  }
  return { body: text.trim(), cta: null };
}

// بدائل قصيرة لعبارات CTA الشائعة
const CTA_ALIASES: Array<{ pattern: RegExp; short: string }> = [
  { pattern: /شاركنا رأيك في التعليقات\s*👇?/, short: "شاركنا 👇" },
  { pattern: /شاركنا رأيك\s*👇?/, short: "شاركنا 👇" },
  { pattern: /تابعنا للمزيد من المحتوى( المفيد)?\s*🔔?/, short: "تابعنا 🔔" },
  { pattern: /تابعنا للمزيد\s*🔔?/, short: "تابعنا 🔔" },
  { pattern: /اضغط لايك إذا وافقت\s*❤?️?/, short: "لايك ❤️" },
  { pattern: /احفظ المنشور للمراجعة\s*📌?/, short: "احفظ 📌" },
  { pattern: /اكتب لنا في التعليقات\s*💬?/, short: "علّق 💬" },
  { pattern: /تاق صديق يحتاج (يسمع|يقرأ) هذا\s*👥?/, short: "تاق صديق 👥" },
];

export function shortenCTA(cta: string): string {
  for (const { pattern, short } of CTA_ALIASES) {
    if (pattern.test(cta)) return short;
  }
  return cta;
}
