import type { Platform, Tone } from "@/lib/store";

const TEMPLATES: Record<Tone, string> = {
  youthful:
    "خلاص يا شباب! 🔥\n\n{topic} — الموضوع مو معقّد زي ما تتخيلون.\n\nجرّب، اكسر الروتين، وشوف الفرق بنفسك ✨\n\nمين معي؟ 👇",
  powerful:
    "🚀 توقف. اقرأ هذا.\n\n{topic} هو الفرق بين اللي يتفرج واللي يصنع.\n\n💥 لا أعذار.\n💥 لا تأجيل.\n💥 ابدأ اليوم.\n\nشاركنا رأيك 👇",
  professional:
    "في عالم يتطور كل يوم، {topic} لم يعد رفاهية بل ضرورة.\n\n1️⃣ الاستراتيجية أهم من الأدوات\n2️⃣ البيانات تُحدث الفرق\n3️⃣ الاستمرارية هي المفتاح\n\nما رأيك؟ شاركنا في التعليقات 👇",
  humorous:
    "أنا: راح أتعلم {topic} اليوم! 💪\nأنا بعد 5 دقائق: ليش الحياة صعبة؟ 😅\n\nبس جدياً، الأمر أسهل مما تتوقعون 🎯",
  dramatic:
    "لم يكن يعلم أن قراراً واحداً سيغيّر كل شيء…\n\n{topic} — لم يبدأ كخطة، بل كإحساس داخلي بأن الوقت قد حان.\n\nوأنت؟ متى ستقرر؟ 💭",
  calm:
    "خذ نفساً عميقاً. 🌿\n\n{topic} لا يحتاج ضجيجاً، بل وضوحاً.\n\nخطوة صغيرة اليوم، أهم من قفزة مؤجّلة.\n\nاحفظ المنشور للمراجعة 📌",
  friendly:
    "يا جماعة! 👋\n\nتعالوا نتكلم عن {topic} بصراحة…\n\nلو طبقتوا هذي الفكرة الصغيرة، راح تتغير أمور كثيرة ✨\n\nمين جرّب قبل؟ 💬",
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
