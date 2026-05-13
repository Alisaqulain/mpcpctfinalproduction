import Link from "next/link";
import { BreadcrumbSchema, FAQSchema, CourseSchema } from "../SEO/StructuredData";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mpcpct.com";

export default function LocalSeoArticle({ data }) {
  if (!data) return null;

  const {
    h1,
    intro,
    sections = [],
    faqs = [],
    course,
    breadcrumbs = [],
    cta,
    internalLinks = [],
  } = data;

  return (
    <article className="bg-gradient-to-b from-slate-50 to-white">
      {faqs.length > 0 && <FAQSchema faqs={faqs} />}
      {breadcrumbs.length > 0 && (
        <BreadcrumbSchema siteUrl={siteUrl} items={breadcrumbs} />
      )}
      {course && (
        <CourseSchema
          siteUrl={siteUrl}
          courseName={course.name}
          description={course.description}
          provider="MPC PCT"
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <nav className="text-sm text-slate-500 mb-8" aria-label="Breadcrumb">
          <ol className="flex flex-wrap gap-2">
            {breadcrumbs.map((bc, i) => (
              <li key={bc.url} className="flex items-center gap-2">
                {i > 0 && <span>/</span>}
                <Link href={bc.url} className="hover:text-indigo-600">
                  {bc.name}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <header className="mb-10">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
            Indore · Madhya Pradesh · India
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2 leading-tight">
            {h1}
          </h1>
          <p className="text-lg text-slate-600 mt-6 leading-relaxed">{intro}</p>
        </header>

        <div className="prose prose-slate max-w-none space-y-12">
          {sections.map((section) => (
            <section key={section.heading} className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 border-b border-indigo-100 pb-2">
                {section.heading}
              </h2>
              {section.paragraphs.map((p, idx) => (
                <p
                  key={idx}
                  className="text-slate-700 leading-relaxed text-base md:text-lg"
                >
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>

        {internalLinks.length > 0 && (
          <div className="mt-12 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Continue your preparation
            </h3>
            <ul className="grid sm:grid-cols-2 gap-3 text-indigo-700 font-medium">
              {internalLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:underline">
                    {l.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {faqs.length > 0 && (
          <div className="mt-14 space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">FAQs</h2>
            <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
              {faqs.map((f) => (
                <details key={f.question} className="p-5 group">
                  <summary className="font-semibold cursor-pointer list-none flex justify-between gap-3 text-slate-900">
                    {f.question}
                    <span className="text-indigo-500">+</span>
                  </summary>
                  <p className="mt-3 text-slate-600 leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        <div className="mt-14 rounded-2xl bg-gradient-to-r from-indigo-700 to-purple-800 text-white p-8 text-center shadow-lg">
          <h3 className="text-2xl font-bold">{cta?.title || "Start practicing on MPC PCT"}</h3>
          <p className="text-indigo-100 mt-3 max-w-2xl mx-auto">
            {cta?.body ||
              "Access CCC & CPCT mock tests, Hindi/English typing labs, and skill analytics built for MP students."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={cta?.primaryHref || "/signup"}
              className="inline-flex rounded-xl bg-white text-indigo-800 px-6 py-3 font-semibold hover:bg-indigo-50"
            >
              {cta?.primaryLabel || "Create free account"}
            </Link>
            <Link
              href={cta?.secondaryHref || "/exam"}
              className="inline-flex rounded-xl border border-white/40 px-6 py-3 font-semibold hover:bg-white/10"
            >
              {cta?.secondaryLabel || "Try mock tests"}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
