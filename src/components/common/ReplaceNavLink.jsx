"use client";

import Link from "next/link";

/** Navigation link that replaces history instead of pushing (Back button goes to prior page). */
export default function ReplaceNavLink({ href, className, children, ...props }) {
  return (
    <Link href={href} replace className={className} {...props}>
      {children}
    </Link>
  );
}
