import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "My Videos",
  description: "Your enrolled course videos.",
  path: "/videos",
  noindex: true,
});

export default function VideosLayout({ children }) {
  return children;
}
