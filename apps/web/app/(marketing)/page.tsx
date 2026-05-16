export default function LandingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-5xl font-semibold tracking-tight">EstateOS</h1>
      <p className="mt-6 text-lg text-neutral-600">
        Операционная AI-платформа для агентств недвижимости. Голосовая
        отчётность, AI-нарратив для руководителя, тренажёр продаж и
        пост-сделочная CRM.
      </p>
      <div className="mt-12">
        <a
          href="/login"
          className="inline-flex items-center rounded-lg bg-brand-500 px-6 py-3 text-white font-medium hover:bg-brand-700 transition"
          data-testid="cta-login"
        >
          Войти
        </a>
      </div>
    </main>
  );
}
