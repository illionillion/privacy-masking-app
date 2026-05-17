import Link from "next/link";
import type { ReactNode } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { legalHeadingToId } from "@/lib/legalHeadingId";

const LINK_CLASS = "font-medium text-indigo-600 underline-offset-2 hover:underline";

type LegalMarkdownContentProps = {
  content: string;
};

function getHeadingText(children: ReactNode): string {
  if (typeof children === "string") {
    return children;
  }
  if (Array.isArray(children)) {
    return children.map(getHeadingText).join("");
  }
  if (children && typeof children === "object" && "props" in children) {
    const props = children.props as { children?: ReactNode };
    return getHeadingText(props.children ?? "");
  }
  return "";
}

const markdownComponents: Components = {
  h2: ({ children }) => {
    const text = getHeadingText(children);
    const id = legalHeadingToId(text);
    return (
      <h2 id={id} className="text-base font-semibold text-zinc-900">
        {children}
      </h2>
    );
  },
  p: ({ children }) => <p>{children}</p>,
  ul: ({ children }) => <ul className="list-inside list-disc space-y-1 pl-1">{children}</ul>,
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong>{children}</strong>,
  a: ({ href, children }) => {
    if (href?.startsWith("/")) {
      return (
        <Link href={href} className={LINK_CLASS}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} className={LINK_CLASS} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
};

/**
 * 法務 Markdown 本文を既存デザインに合わせてレンダリングする。
 */
export function LegalMarkdownContent({ content }: LegalMarkdownContentProps) {
  return (
    <div className="space-y-6">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
