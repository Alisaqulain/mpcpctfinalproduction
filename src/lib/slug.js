/** URL-safe slug: lowercase, spaces → hyphens, strip invalid chars. */
export function normalizeSlug(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function slugsMatch(a, b) {
  return normalizeSlug(a) === normalizeSlug(b);
}
