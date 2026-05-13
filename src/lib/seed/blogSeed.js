/** Markdown bodies for initial SEO articles — run POST /api/admin/blog/seed as admin */

export const seedCategories = [
  { name: "CCC Exam", slug: "ccc-exam", description: "Course on Computer Concepts" },
  { name: "CPCT & MP", slug: "cpct-mp", description: "Computer Proficiency Certification Test" },
  { name: "Typing", slug: "typing", description: "Hindi & English typing skills" },
  { name: "Careers & Govt Exams", slug: "government-exams", description: "Certification & recruitment context" },
];

export function postsWithCategoryIds(categoryMap) {
  const c = (slug) => categoryMap[slug];

  return [
    {
      title: "How to prepare for CCC exam — structured plan for MP students",
      slug: "how-to-prepare-for-ccc-exam",
      excerpt:
        "Break the CCC syllabus into weekly blocks, pair MCQs with LibreOffice labs, and validate readiness with timed mocks.",
      category: c("ccc-exam"),
      tags: ["CCC", "syllabus", "NIELIT"],
      content: `## Table of contents
## Week-by-week roadmap
## LibreOffice practice checklist
## Mock test cadence
## Exam-day checklist

## Week-by-week roadmap
Start by auditing the official **Course on Computer Concepts** objectives. Allocate the first week entirely to fundamentals—hardware, software, OS basics—and pair each chapter with ten adaptive MCQs. Reserve week two for word processing and spreadsheets because recruiters implicitly test whether you can format documents under mild pressure. Week three tackles presentations, internet services, and digital payments. Week four blends revision with full-length simulations so stamina matches exam hall expectations.

## LibreOffice practice checklist
Practice saving documents in multiple formats, applying styles instead of manual spacing, and using templates for repetitive letters. In Calc, rehearse SUM/AVERAGE, sorting, basic charts, and cell protection scenarios. Impress decks should balance concise bullets with speaker notes when prompts demand narration.

## Mock test cadence
Attempt two timed mocks weekly once foundations settle. Log mistakes inside a spreadsheet—yes, meta—and reattempt weak stems after 48 hours to exploit spaced repetition.

## Exam-day checklist
Carry valid ID, admit card printouts, and reach the centre early. Warm up with calm breathing—not cramming—to keep working memory free.`,
    },
    {
      title: "Best CPCT preparation strategy — typing + comprehension together",
      slug: "best-cpct-preparation-strategy",
      excerpt:
        "Avoid isolating typing drills from comprehension; MPC PCT learners improve faster when sessions reinforce each other.",
      category: c("cpct-mp"),
      tags: ["CPCT", "strategy", "MP"],
      content: `## Table of contents
## Diagnostic first
## Weekly rhythm
## Bilingual typing splits
## Mindset & recovery

## Diagnostic first
Run a diagnostic mock highlighting weakest quadrants—English typing, Hindi typing, comprehension, aptitude, or awareness. Weight weekly minutes proportionally.

## Weekly rhythm
Alternate heavy comprehension mornings with afternoon quantitative bursts. End Fridays with full simulations exporting analytics you actually review.

## Bilingual typing splits
Never batch Hindi and English back-to-back without breaks; alternate days or sessions to maintain neural agility.

## Mindset & recovery
Sleep and hydration influence comprehension velocity more than marginal cramming.`,
    },
    {
      title: "Hindi typing tips for CPCT & government exams",
      slug: "hindi-typing-tips",
      excerpt:
        "Matras, conjunct clusters, and scheme vocabulary deserve deliberate drills—not vanity speed.",
      category: c("typing"),
      tags: ["Hindi typing", "CPCT"],
      content: `## Table of contents
## Accuracy gates
## Font familiarity
## Dictation practice

## Accuracy gates
Lock accuracy targets before chasing WPM. MPC PCT lanes escalate difficulty only after sustained precision.

## Font familiarity
Confirm recruitment notices for mandated fonts—practice exactly those layouts.

## Dictation practice
Blend listening with typing to mimic departmental transcription tasks.`,
    },
    {
      title: "English typing speed improvement — accuracy-first ladders",
      slug: "english-typing-speed-improvement",
      excerpt:
        "Structured bursts plus ergonomics beat chaotic marathon sessions.",
      category: c("typing"),
      tags: ["English typing", "WPM"],
      content: `## Table of contents
## Burst ladders
## Ergonomics
## Portfolio proof

## Burst ladders
Alternate 2-minute bursts with 10-minute endurance paragraphs weekly.

## Ergonomics
Adjust chair height so elbows stay near ninety degrees—fatigue silently destroys accuracy.

## Portfolio proof
Export MPC PCT streak summaries to demonstrate disciplined improvement to mentors.`,
    },
    {
      title: "CPCT exam pattern — what MPC PCT simulations mirror",
      slug: "cpct-exam-pattern",
      excerpt:
        "Understand section intents even when official bulletins shift weightings.",
      category: c("cpct-mp"),
      tags: ["CPCT pattern", "MP"],
      content: `## Table of contents
## Section overview
## Timed simulations
## Adaptive analytics

## Section overview
Expect bilingual typing, comprehension, quantitative reasoning, and awareness blending MP schemes with national headlines.

## Timed simulations
MPC PCT mirrors countdown psychology—not merely questions—to reduce hall anxiety.

## Adaptive analytics
Review/export dashboards weekly; storytelling beats vague attempts.`,
    },
    {
      title: "CCC syllabus highlights mapped to MPC PCT modules",
      slug: "ccc-syllabus",
      excerpt:
        "Align chapters with interactive tasks instead of passive reading.",
      category: c("ccc-exam"),
      tags: ["CCC syllabus"],
      content: `## Table of contents
## Digital literacy pillars
## Productivity suite
## Responsible computing

## Digital literacy pillars
Operating systems, files, networks, and security basics anchor everything else.

## Productivity suite
Word processing, spreadsheets, presentations—practice formatting under timers.

## Responsible computing
Ethics, environment, and cyber hygiene frequently yield nuanced MCQs.`,
    },
    {
      title: "Government computer certification guide — CCC vs CPCT priorities",
      slug: "government-computer-certification-guide",
      excerpt:
        "Pick certifications strategically based on recruitment notices you target.",
      category: c("government-exams"),
      tags: ["certification", "government"],
      content: `## Table of contents
## CCC pathways
## CPCT pathways
## Combining credentials

## CCC pathways
Ideal when notices explicitly demand NIELIT CCC.

## CPCT pathways
Essential for many MP government roles measuring bilingual proficiency.

## Combining credentials
Stack certifications thoughtfully—quality narratives beat quantity.`,
    },
    {
      title: "Top typing tricks that survive real exam pressure",
      slug: "top-typing-tricks",
      excerpt:
        "Breath control, micro-breaks, and mistaketaxonomies—not gimmicks.",
      category: c("typing"),
      tags: ["typing tricks"],
      content: `## Table of contents
## Rhythm
## Error taxonomy
## Simulation fidelity

## Rhythm
Match breathing with paragraph breaks to avoid shoulder lock during long passages.

## Error taxonomy
Tag mistakes as mechanical vs comprehension-induced—fixes differ.

## Simulation fidelity
Practice with identical timing constraints and banned shortcuts expected in halls.`,
    },
    {
      title: "Best typing websites — why MPC PCT consolidates practice",
      slug: "best-typing-websites",
      excerpt:
        "Fragmented tools waste context; integrated analytics accelerate improvement.",
      category: c("typing"),
      tags: ["typing", "MPC PCT"],
      content: `## Table of contents
## Consolidation wins
## Analytics matter
## Local context

## Consolidation wins
Switching between unrelated typing sites loses longitudinal insight.

## Analytics matter
MPC PCT tracks streaks, accuracy clusters, and comprehension alignment.

## Local context
MP-specific vocabulary and CPCT-oriented passages keep relevance high.`,
    },
    {
      title: "CPCT preparation in Indore — hybrid coaching + online drills",
      slug: "cpct-preparation-in-indore",
      excerpt:
        "Blend classroom motivation with always-on simulations tailored to MP aspirants.",
      category: c("cpct-mp"),
      tags: ["Indore", "CPCT"],
      content: `## Table of contents
## Hybrid calendars
## Local cohort advantages
## MPC PCT overlays

## Hybrid calendars
Use weekends for intensive mocks and weekdays for micro quizzes around college schedules.

## Local cohort advantages
Study circles plus MPC PCT analytics accelerate doubt resolution.

## MPC PCT overlays
Exportable PDF dashboards keep guardians informed without micromanaging.`,
    },
  ];
}
