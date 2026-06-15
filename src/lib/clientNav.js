/** Replace current history entry (fixes browser Back returning to closed pages). */
export function navigateReplace(url) {
  if (typeof window !== "undefined") {
    window.location.replace(url);
  }
}
