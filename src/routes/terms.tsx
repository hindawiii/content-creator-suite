import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, PageHeader } from "@/components/ui";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Post On — شروط الاستخدام" },
      {
        name: "description",
        content: "شروط استخدام تطبيق Post On: مسؤوليتك عن المحتوى، مفاتيح الذكاء الاصطناعي، وحدود الخدمة.",
      },
      { property: "og:title", content: "شروط الاستخدام — Post On" },
      {
        property: "og:description",
        content: "القواعد التي تحكم استخدامك لتطبيق Post On لتوليد ونشر المحتوى.",
      },
    ],
  }),
  component: TermsPage,
});

const sections = [
  {
    title: "١. قبول الشروط",
    body: "باستخدامك تطبيق Post On فإنك توافق على هذه الشروط. إن لم توافق عليها، يُرجى التوقف عن استخدام التطبيق.",
  },
  {
    title: "٢. طبيعة الخدمة",
    body: "Post On أداة تعمل داخل متصفحك فقط. لا يوجد خادم يخزّن بياناتك، وكل ما تنشئه يبقى على جهازك. تُرسل طلبات التوليد مباشرة من متصفحك إلى مزوّدي الذكاء الاصطناعي الذين تختارهم.",
  },
  {
    title: "٣. مفاتيح الذكاء الاصطناعي",
    body: "أنت مسؤول عن مفاتيحك الخاصة (Groq، Google AI Studio، Pollinations وغيرها) وعن أي تكاليف أو حدود استخدام يفرضها المزوّد. تُخزَّن المفاتيح في متصفحك بصيغة مُشوَّشة وليست تشفيراً كاملاً، لذا لا تستخدم التطبيق على جهاز عام أو مشترك.",
  },
  {
    title: "٤. مسؤوليتك عن المحتوى",
    body: "المحتوى الذي يولّده الذكاء الاصطناعي قد يحتوي على أخطاء أو معلومات غير دقيقة. راجع كل نص وصورة قبل النشر. أنت وحدك المسؤول عمّا تنشره وعن التزامه بقوانين بلدك وسياسات المنصات الاجتماعية.",
  },
  {
    title: "٥. الاستخدام المحظور",
    body: "يُمنع استخدام التطبيق لتوليد محتوى مخالف للقانون، أو محرّض على الكراهية أو العنف، أو منتهك لحقوق الآخرين، أو مضلّل بشكل متعمد.",
  },
  {
    title: "٦. حدود الضمان",
    body: "يُقدَّم التطبيق «كما هو» دون أي ضمان. قد تتوقف خدمات المزوّدين الخارجيين أو تتغير في أي وقت دون إشعار.",
  },
  {
    title: "٧. تعديل الشروط",
    body: "قد تُحدَّث هذه الشروط من وقت لآخر، ويسري التحديث فور نشره داخل التطبيق.",
  },
];

function TermsPage() {
  return (
    <AppLayout>
      <PageHeader title="شروط الاستخدام" subtitle="آخر تحديث: سبتمبر ٢٠٢٦" />
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
            <Link to="/privacy" className="text-accent hover:underline">
              سياسة الخصوصية
            </Link>
            .
          </p>
        </Card>
      </div>
    </AppLayout>
  );
}
