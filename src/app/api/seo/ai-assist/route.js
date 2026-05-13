import { NextResponse } from "next/server";

/** Lightweight SEO helpers — extend with OpenAI when API keys are configured */
export async function POST(request) {
  try {
    const body = await request.json();
    const topic = String(body.topic || "").trim();
    const action = String(body.action || "meta");

    if (!topic) {
      return NextResponse.json({ error: "topic required" }, { status: 400 });
    }

    if (action === "meta") {
      const title = `${topic} | MPC PCT — Indore & MP`.slice(0, 65);
      const description =
        `Learn about ${topic} on MPC PCT: CCC, CPCT, typing practice & government computer exams for Madhya Pradesh students.`.slice(
          0,
          160
        );
      return NextResponse.json({ title, description });
    }

    if (action === "keywords") {
      const base = topic.toLowerCase().split(/\s+/).filter(Boolean);
      const extras = [
        "CCC exam Indore",
        "CPCT preparation",
        "typing test online",
        "MP CPCT",
        "government computer certification",
      ];
      return NextResponse.json({ keywords: [...new Set([...base, ...extras])].slice(0, 20) });
    }

    if (action === "faq") {
      return NextResponse.json({
        faqs: [
          {
            question: `What should beginners know about ${topic}?`,
            answer:
              "Start with diagnostic practice on MPC PCT, track accuracy before speed, and revise weekly using localized guides for Indore & MP exams.",
          },
          {
            question: `How does MPC PCT help with ${topic}?`,
            answer:
              "Structured mocks, bilingual typing lanes, and analytics translate preparation into measurable weekly gains.",
          },
        ],
      });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "assist failed" }, { status: 500 });
  }
}
