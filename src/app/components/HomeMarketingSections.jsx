import Link from "next/link";
import { FAQSchema } from "./SEO/StructuredData";

const faqs = [
  {
    question: "Is MPC PCT the best CPCT practice platform for students in Indore?",
    answer:
      "MPC PCT is built for Madhya Pradesh CPCT and CCC aspirants. You get timed mock tests, bilingual typing modules, and skill assessments aligned with exam patterns—ideal for learners in Indore who want structured daily practice instead of random PDFs.",
  },
  {
    question: "Where can I take a free Hindi typing test and English typing practice online?",
    answer:
      "Use MPC PCT’s typing modules for Hindi Krutidev / Mangal-style practice and English speed drills. Progress tracking helps you improve accuracy before sit-down exams and CPCT typing sections.",
  },
  {
    question: "Do you offer CCC online exam style mock tests?",
    answer:
      "Yes. You can attempt CCC-style MCQ practice and topic-wise sessions that mirror the Course on Computer Concepts syllabus so you build confidence before the real NIELIT exam.",
  },
  {
    question: "How does MPC PCT help with government computer exam practice?",
    answer:
      "The platform combines computer fundamentals, mock papers, and typing benchmarks—useful for CPCT, CCC, and general MP government recruitment preparation where computer proficiency is tested.",
  },
];

export default function HomeMarketingSections() {
  return (
    <section className="relative z-10 bg-gradient-to-b from-slate-50 via-white to-indigo-50/40 border-t border-indigo-100">
      <FAQSchema faqs={faqs} />

      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 space-y-20">
        <div className="text-center space-y-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
            MPC PCT · Indore · Madhya Pradesh
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            CCC Exam, CPCT Practice &amp; Typing Test Platform Built for MP Students
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Prepare for{" "}
            <strong>CCC exam</strong>, <strong>CPCT mock tests</strong>, and{" "}
            <strong>government computer certification</strong> goals with one
            consistent dashboard. MPC PCT blends{" "}
            <strong>online exam practice</strong>,{" "}
            <strong>Hindi typing test</strong> labs, and{" "}
            <strong>English typing practice</strong> so Indore learners can
            train speed and accuracy without switching between disconnected apps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "CPCT Practice & MP CPCT alignment",
              body: "Structured drills for CPCT-style proficiency: reasoning-friendly MCQs, comprehension practice, and typing lanes that respect exam rhythm—especially helpful if you are searching for CPCT preparation Indore or MP CPCT coaching online.",
            },
            {
              title: "CCC online test & syllabus coverage",
              body: "Revise digital literacy, LibreOffice, internet fundamentals, and ethics with modules suited to CCC online exam preparation. Pair theory with timed attempts to reduce exam-day anxiety.",
            },
            {
              title: "Typing speed test & skill assessment",
              body: "Measure WPM, accuracy, and consistency with dashboards that show improvement week over week—critical for secretarial cadres and CPCT typing sections.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-indigo-100 bg-white/90 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold text-slate-900 mb-3">
                {card.title}
              </h2>
              <p className="text-slate-600 leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-700 to-slate-900 text-white p-8 md:p-12 shadow-xl">
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold">
                Why students in Indore choose MPC PCT
              </h2>
              <p className="text-indigo-100 leading-relaxed">
                Indore has a competitive queue for government roles. MPC PCT
                concentrates on{" "}
                <strong>computer certification</strong> pathways—CCC for NIELIT
                recognition and CPCT for Madhya Pradesh recruitment—while keeping
                practice{" "}
                <strong>mobile-first</strong> and keyboard-friendly. Local SEO
                landing pages cover{" "}
                <Link className="underline font-semibold" href="/ccc-exam-indore">
                  CCC exam in Indore
                </Link>
                ,{" "}
                <Link className="underline font-semibold" href="/cpct-preparation-indore">
                  CPCT preparation Indore
                </Link>
                , and{" "}
                <Link className="underline font-semibold" href="/typing-test-indore">
                  typing test Indore
                </Link>{" "}
                so you can deep-dive context-specific guidance.
              </p>
              <p className="text-indigo-100 leading-relaxed">
                Whether you need a <strong>free CCC mock test</strong> sprint or a
                calm <strong>CPCT practice test</strong> weekend, you can stack
                micro-goals that fit college schedules and working learners.
              </p>
            </div>
            <ul className="space-y-4 text-indigo-50">
              {[
                "Bilingual support for Hindi & English typing sessions",
                "Exam modes that simulate pressure with countdown timers",
                "Skill assessment snapshots to share with mentors",
                "Blog playbooks for CCC syllabus, CPCT exam pattern, and typing tricks",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-300 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">
              Trusted practice signals
            </h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              Institutions and trainers across Madhya Pradesh route students to
              focused digital labs. MPC PCT complements classroom coaching with{" "}
              <strong>online typing test platform</strong> access, repeat
              attempts, and transparent scoring—reducing friction for candidates
              who cannot commute daily.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Explore{" "}
              <Link href="/blog" className="text-indigo-600 font-semibold underline">
                MPC PCT Insights
              </Link>{" "}
              for long-form guides on Hindi typing tips, English speed, and CPCT
              strategy. Each article ships with reading time, structured headings,
              and internal links back to live practice routes.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Practice modes", value: "Learning · Skill · Exam" },
              { label: "Focus regions", value: "Indore · MP · India" },
              { label: "Core exams", value: "CCC · CPCT · Typing" },
              { label: "Support", value: "Email & WhatsApp guidance" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"
              >
                <p className="text-2xl font-bold text-indigo-700">{stat.value}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500 mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 text-center">
            Frequently asked questions
          </h3>
          <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {faqs.map((faq) => (
              <details key={faq.question} className="group p-6 cursor-pointer">
                <summary className="font-semibold text-slate-900 list-none flex justify-between gap-4">
                  {faq.question}
                  <span className="text-indigo-500 group-open:rotate-180 transition">
                    ▾
                  </span>
                </summary>
                <p className="mt-4 text-slate-600 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl bg-slate-900 text-white px-8 py-10">
          <div>
            <p className="text-sm uppercase tracking-widest text-indigo-300">
              Start today
            </p>
            <h3 className="text-2xl font-bold mt-2">
              Ready for CCC · CPCT · Typing success?
            </h3>
            <p className="text-slate-300 mt-2 max-w-xl">
              Login to track attempts or browse localized guides for Indore
              aspirants. Combine daily typing streaks with weekly mock tests for
              compounding results.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-6 py-3 font-semibold hover:bg-indigo-400 transition"
            >
              Create free account
            </Link>
            <Link
              href="/exam"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 px-6 py-3 font-semibold hover:bg-white/10 transition"
            >
              Explore mock tests
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
