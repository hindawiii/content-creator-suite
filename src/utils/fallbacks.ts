import type { Platform, Tone } from "@/lib/store";

const TEMPLATES: Record<Tone, string> = {
  professional:
    "في عالم يتطور كل يوم، {topic} لم يعد رفاهية بل ضرورة.\n\n1️⃣ الاستراتيجية أهم من الأدوات\n2️⃣ البيانات تُحدث الفرق\n3️⃣ الاستمرارية هي المفتاح\n\nما رأيك؟ شاركنا في التعليقات 👇",
  friendly:
    "يا جماعة! 👋\n\nتعالوا نتكلم عن {topic} بصراحة…\n\nلو طبقتوا هذي الفكرة الصغيرة، راح تتغير أمور كثيرة ✨\n\nمين جرّب قبل؟ 💬",
  humorous:
    "أنا: راح أتعلم {topic} اليوم! 💪\nأنا بعد 5 دقائق: ليش الحياة صعبة؟ 😅\n\nبس جدياً، الأمر أسهل مما تتوقعون 🎯",
  motivational:
    "لا تنتظر اللحظة المثالية.\n\n{topic} يبدأ بخطوة واحدة صغيرة اليوم.\n\n🔥 كل خبير كان مبتدئاً.\n🔥 كل قصة نجاح بدأت بقرار.\n\nابدأ الآن. ✨",
};

const DEFAULT_TAGS = [
  "#تسويق_رقمي","#صناعة_محتوى","#ريادة_أعمال","#سوشيال_ميديا","#نمو",
  "#إبداع","#محتوى_عربي","#PostOn","#marketing","#content","#growth","#branding",
];

export function localFallback(topic: string, tone: Tone, platform: Platform): { content: string; hashtags: string[] } {
  const body = TEMPLATES[tone].replace(/\{topic\}/g, topic || "الموضوع");
  const count = platform === "twitter" ? 5 : 12;
  return { content: body, hashtags: DEFAULT_TAGS.slice(0, count) };
}
