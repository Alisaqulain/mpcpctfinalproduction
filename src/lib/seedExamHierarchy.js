import dbConnect from "@/lib/db";
import MainCategory from "@/lib/models/MainCategory";
import ExamSubCategory from "@/lib/models/ExamSubCategory";

const DEFAULT_CATEGORY = {
  name: "Computer Exams",
  slug: "computer-exams",
  description: "CPCT, RSCIT, CCC, and topic-wise practice",
  order: 0,
};

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
 * Ensures at least one main category + default subcategories exist (idempotent).
 */
export async function ensureDefaultExamHierarchy() {
  await dbConnect();
  let main = await MainCategory.findOne({ slug: DEFAULT_CATEGORY.slug });
  if (!main) {
    main = await MainCategory.create(DEFAULT_CATEGORY);
  }
  for (const sub of DEFAULT_SUBS) {
    const exists = await ExamSubCategory.findOne({
      categoryId: main._id,
      slug: sub.slug,
    });
    if (!exists) {
      await ExamSubCategory.create({
        ...sub,
        categoryId: main._id,
      });
    }
  }
  return main;
}
