import dbConnect from "@/lib/db";
import MainCategory from "@/lib/models/MainCategory";
import ExamSubCategory from "@/lib/models/ExamSubCategory";

const DEFAULT_CATEGORIES = [
  {
    name: "Computer Exams",
    slug: "computer-exams",
    description: "CPCT, RSCIT, CCC, and topic-wise practice",
    order: 1,
  },
  {
    name: "Competitive Exams",
    slug: "competitive-exams",
    description: "SSC, banking, and other competitive exam practice",
    order: 3,
  },
];

const DEFAULT_SUBS = [
  { name: "CPCT", slug: "cpct", legacyExamTypeKey: "CPCT", isTopicWise: false, order: 0 },
  { name: "RSCIT", slug: "rscit", legacyExamTypeKey: "RSCIT", isTopicWise: false, order: 1 },
  { name: "CCC", slug: "ccc", legacyExamTypeKey: "CCC", isTopicWise: false, order: 2 },
  {
    name: "Topic-wise MCQ",
    slug: "topic-wise-mcq",
    legacyExamTypeKey: "CUSTOM",
    isTopicWise: true,
    order: 3,
  },
];

/**
 * Ensures default exam hierarchy exists on first setup (idempotent).
 * Default main categories are only auto-created when the DB has none —
 * so admin deletes are not undone on the next /api/categories request.
 */
export async function ensureDefaultExamHierarchy() {
  await dbConnect();

  const categoryCount = await MainCategory.countDocuments();
  if (categoryCount === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await MainCategory.create(cat);
    }
  }

  const computerMain = await MainCategory.findOne({ slug: "computer-exams" });
  if (computerMain) {
    for (const sub of DEFAULT_SUBS) {
      const exists = await ExamSubCategory.findOne({
        categoryId: computerMain._id,
        slug: sub.slug,
      });
      if (!exists) {
        await ExamSubCategory.create({
          ...sub,
          categoryId: computerMain._id,
        });
      }
    }
  }
  return computerMain;
}
