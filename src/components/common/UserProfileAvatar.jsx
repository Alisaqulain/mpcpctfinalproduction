"use client";

import React from "react";
import { DEFAULT_PROFILE_AVATAR, resolveUserProfileUrl } from "@/lib/userProfile";

export default function UserProfileAvatar({
  user,
  src,
  alt = "Profile",
  className = "w-8 h-8 rounded-full border object-cover bg-white",
  fallbackSrc = DEFAULT_PROFILE_AVATAR,
  ...props
}) {
  const imageSrc = src
    ? resolveUserProfileUrl({ profileUrl: src, avatar: src })
    : resolveUserProfileUrl(user);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = fallbackSrc;
      }}
      {...props}
    />
  );
}
