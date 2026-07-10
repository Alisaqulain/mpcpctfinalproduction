/** Format date as DD/MM/YYYY (e.g. 10/07/2026) */
export function formatResultDateDDMM(dateVal) {
  if (!dateVal) {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }

  const parsed = new Date(dateVal);
  if (!Number.isNaN(parsed.getTime())) {
    return `${String(parsed.getDate()).padStart(2, "0")}/${String(parsed.getMonth() + 1).padStart(2, "0")}/${parsed.getFullYear()}`;
  }

  return String(dateVal);
}
