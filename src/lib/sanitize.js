/** Basic text sanitization for user/admin messages. */
export function sanitizeMessage(text, maxLen = 4000) {
  if (text == null) return "";
  let s = String(text).trim();
  s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  s = s.replace(/<[^>]+>/g, "");
  if (s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}
