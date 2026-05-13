"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import GithubSlugger from "github-slugger";

function flattenText(children) {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(flattenText).join("");
  }
  if (children?.props?.children != null) {
    return flattenText(children.props.children);
  }
  return "";
}

export default function BlogPostBody({ markdown }) {
  const slugger = new GithubSlugger();

  return (
    <div className="prose prose-slate lg:prose-lg max-w-none prose-headings:scroll-mt-24 prose-a:text-indigo-600">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => {
            const text = flattenText(children);
            const id = slugger.slug(text);
            return <h2 id={id}>{children}</h2>;
          },
          h3: ({ children }) => {
            const text = flattenText(children);
            const id = slugger.slug(text);
            return <h3 id={id}>{children}</h3>;
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
