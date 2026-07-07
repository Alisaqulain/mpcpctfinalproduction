export const DEFAULT_PROFILE_AVATAR = "/lo.jpg";

const PROFILE_URL_KEYS = [
  "profileImage",
  "avatar",
  "uploadedProfileImage",
  "photoURL",
  "profileUrl",
  "profilePicture",
  "image",
];

export function resolveUserProfileUrl(user) {
  if (!user || typeof user !== "object") return DEFAULT_PROFILE_AVATAR;

  for (const key of PROFILE_URL_KEYS) {
    const value = user[key];
    if (value && String(value).trim()) {
      return String(value).trim();
    }
  }

  return DEFAULT_PROFILE_AVATAR;
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
