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
          "كيف يتعامل Post On مع بياناتك: كل شيء محلي في متصفحك، بلا خوادم ولا حسابات ولا تتبّع.",
      },
      { property: "og:title", content: "سياسة الخصوصية — Post On" },
      {
        property: "og:description",
        content: "بياناتك تبقى على جهازك: لا خوادم، لا حسابات، لا تتبّع إعلاني.",
      },
    ],
  }),
  component: PrivacyPage,
});

const sections = [
  {
    title: "١. لا نجمع أي بيانات",
    body: "لا يملك Post On خادماً ولا قاعدة بيانات. لا نجمع اسمك ولا بريدك ولا أي معرّف شخصي، ولا يوجد تسجيل دخول أصلاً.",
  },
  {
    title: "٢. أين تُحفظ بياناتك",
    body: "المنشورات والصور والجدولة والإعدادات تُحفظ في ذاكرة متصفحك المحلية (LocalStorage) على جهازك فقط. حذف بيانات المتصفح يحذفها نهائياً، لذا استخدم زر «تصدير نسخة احتياطية» في الإعدادات.",
  },
  {
    title: "٣. مفاتيح الذكاء الاصطناعي",
    body: "تُخزَّن مفاتيحك في متصفحك بصيغة مُشوَّشة ولا تُرسل إلينا إطلاقاً. تُستخدم فقط عند إرسال طلب مباشر من متصفحك إلى المزوّد الذي اخترته.",
  },
  {
    title: "٤. أطراف خارجية",
    body: "عند التوليد يتصل متصفحك مباشرة بخدمات مثل Groq وTogether AI وPollinations وGoogle AI Studio. يخضع ما ترسله لسياسات خصوصية تلك الخدمات، ويُنصح بمراجعتها.",
  },
  {
    title: "٥. لا تتبّع ولا إعلانات",
    body: "لا نستخدم أي أدوات تحليلات خارجية ولا ملفات تتبّع إعلانية. صفحة «التحليلات» داخل التطبيق تحسب أرقامك من بياناتك المحلية فقط.",
  },
  {
    title: "٦. الإشعارات",
    body: "إن سمحت بالإشعارات، تُستخدم فقط لتذكيرك بمواعيد منشوراتك المجدولة أثناء فتح التطبيق، ولا تُرسل إلى أي جهة.",
  },
  {
    title: "٧. التواصل",
    body: "لأي استفسار حول الخصوصية، تواصل معنا عبر قناة الدعم المعتمدة للتطبيق.",
  },
];

function PrivacyPage() {
  return (
    <AppLayout>
      <PageHeader title="سياسة الخصوصية" subtitle="آخر تحديث: سبتمبر ٢٠٢٦" />
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
