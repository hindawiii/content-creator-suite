import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader } from "@/components/ui";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Post On — سياسة الخصوصية" },
      {
        name: "description",
        content:
          "كيف يتعامل Post On مع بياناتك: تعمل محليًا بدون حساب، والحساب الاختياري يحفظ نسخة من بياناتك بأمان، بلا تتبّع إعلاني.",
      },
      { property: "og:title", content: "سياسة الخصوصية — Post On" },
      {
        property: "og:description",
        content: "بياناتك لك: استخدام بدون حساب، مزامنة اختيارية آمنة، ولا تتبّع إعلاني.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

const sections = [
  {
    title: "١. الاستخدام بدون حساب",
    body: "يمكنك استخدام Post On كاملًا بدون تسجيل. في هذه الحالة تبقى منشوراتك وصورك وجدولتك وإعداداتك في ذاكرة متصفحك على جهازك فقط، وحذف بيانات المتصفح يحذفها، لذا استخدم «تصدير نسخة احتياطية» في الإعدادات.",
  },
  {
    title: "٢. الحساب الاختياري",
    body: "إن أنشأت حسابًا نحفظ بريدك واسمك وصورتك الشخصية، ونسخة من منشوراتك وجدولتك وفيديوهاتك لتظهر على أي جهاز تدخل منه. لا يستطيع غيرك الوصول إلى هذه البيانات، ويمكنك حذفها بحذف بياناتك من الإعدادات.",
  },
  {
    title: "٣. مفاتيح الذكاء الاصطناعي",
    body: "مفاتيحك تبقى على جهازك فقط بصيغة مُشوَّشة، ولا تُرفع مع حسابك ولا تُرسل إلينا إطلاقًا. تُستخدم فقط عند إرسال طلب مباشر من متصفحك إلى المزوّد الذي اخترته.",
  },
  {
    title: "٤. أطراف خارجية",
    body: "عند التوليد يتصل متصفحك مباشرة بخدمات مثل Groq وTogether AI وPollinations وGoogle AI Studio وPuter. يخضع ما ترسله لسياسات خصوصية تلك الخدمات. وعند النشر تفتح أنت المنصة بنفسك، ولا نملك أي صلاحية على حساباتك فيها.",
  },
  {
    title: "٥. لا تتبّع ولا إعلانات",
    body: "لا نستخدم ملفات تتبّع إعلانية. صفحة «التحليلات» داخل التطبيق تحسب أرقامك من بياناتك أنت فقط.",
  },
  {
    title: "٦. الإشعارات",
    body: "إن فعّلت تذكيرات الجدولة، نحفظ عنوان الإشعارات الخاص بجهازك لنرسل لك تذكيرًا عند موعد منشورك فقط، حتى والتطبيق مغلق. يمكنك إيقافها في أي وقت من صفحة «الجدولة» أو من إعدادات المتصفح.",
  },
  {
    title: "٧. التواصل",
    body: "لأي استفسار حول الخصوصية، تواصل معنا عبر قناة الدعم المعتمدة للتطبيق.",
  },
];

function PrivacyPage() {
  return (
    <AppLayout>
      <PageHeader title="سياسة الخصوصية" subtitle="آخر تحديث: نوفمبر ٢٠٢٦" />
      <div className="space-y-4">
        {sections.map((s) => (
          <Card key={s.title}>
            <h2 className="text-base font-bold">{s.title}</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{s.body}</p>
          </Card>
        ))}
        <Card>
          <p className="text-sm text-muted-foreground">
            اطّلع أيضاً على{" "}
            <Link to="/terms" className="text-accent hover:underline">
              شروط الاستخدام
            </Link>
            .
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}
