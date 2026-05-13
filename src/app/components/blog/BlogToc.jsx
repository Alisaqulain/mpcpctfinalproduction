import Link from "next/link";

export default function BlogToc({ items }) {
  if (!items?.length) return null;
  return (
    <aside className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 mb-10">
      <p className="text-sm font-semibold text-indigo-800 uppercase tracking-wide mb-3">
        Table of contents
      </p>
      <ul className="space-y-2 text-indigo-900">
        {items.map((item) => (
          <li key={item.id} className={item.level === 3 ? "ml-4 text-sm" : ""}>
            <Link href={`#${item.id}`} className="hover:underline">
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
