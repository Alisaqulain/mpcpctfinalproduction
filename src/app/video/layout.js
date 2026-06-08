import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "Watch Video",
  description: "Protected course video — login required.",
  path: "/video",
  noindex: true,
});

export default function VideoLayout({ children }) {
  return children;
}
