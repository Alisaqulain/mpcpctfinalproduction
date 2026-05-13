import GithubSlugger from "github-slugger";

export function estimateReadingMinutesMarkdown(text) {
  if (!text || typeof text !== "string") return 1;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function headingsFromMarkdown(md) {
  const slugger = new GithubSlugger();
  const lines = String(md || "").split("\n");
  const toc = [];
  for (const line of lines) {
    const m = /^(#{2,3})\s+(.+)$/.exec(line.trim());
    if (m) {
      const level = m[1].length;
      const title = m[2].trim().replace(/\s+#+\s*$/, "");
      const id = slugger.slug(title) || `section-${toc.length}`;
      toc.push({ level, title, id });
    }
  }
  return toc;
}

export function buildMetaFromTitle(title) {
  const base = String(title || "").trim();
  return {
    metaTitle: base.slice(0, 70),
    metaDescription: `Read ${base} on MPC PCT — CCC, CPCT, and typing exam guidance for Indore & MP.`.slice(
      0,
      160
    ),
  };
}
