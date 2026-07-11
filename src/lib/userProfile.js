/** Neutral avatar — same as Profile page (not Contact Us /support.png or brand /lo.jpg) */
export const DEFAULT_PROFILE_AVATAR = "/user.jpg";

/** Brand / support assets must never be treated as a student profile photo */
const NON_PROFILE_IMAGE_PATHS = new Set([
  "/support.png",
  "/lo.jpg",
  "/logor.png",
  "/logo2.png",
  "/LOGO.png",
  "/log.png",
  "/plogo.png",
  "/mpc.png",
]);

const PROFILE_URL_KEYS = [
  "profileImage",
  "avatar",
  "uploadedProfileImage",
  "photoURL",
  "profileUrl",
  "profilePicture",
];

function isUsableProfileUrl(value) {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const path = trimmed.startsWith("http")
      ? new URL(trimmed).pathname
      : trimmed.split("?")[0];
    if (NON_PROFILE_IMAGE_PATHS.has(path)) return false;
  } catch {
    /* keep url */
  }
  return true;
}

export function resolveUserProfileUrl(user) {
  if (!user || typeof user !== "object") return DEFAULT_PROFILE_AVATAR;

  for (const key of PROFILE_URL_KEYS) {
    const value = user[key];
    if (isUsableProfileUrl(value)) {
      return String(value).trim();
    }
  }

  return DEFAULT_PROFILE_AVATAR;
}

/** Mobile number shown as Roll No on score cards */
export function resolveUserRollNo(user) {
  if (!user || typeof user !== "object") return "-------";
  const mobile = user.phoneNumber || user.mobile;
  if (mobile && String(mobile).trim()) {
    return String(mobile).trim();
  }
  return "-------";
}

export async function fetchUserProfileFromApi() {
  try {
    const res = await fetch("/api/profile", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export function mergeExamUserProfile(...sources) {
  return sources.reduce((acc, source) => {
    if (source && typeof source === "object") {
      return { ...acc, ...source };
    }
    return acc;
  }, {});
}

export function readExamUserDataFromStorage() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("examUserData");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
