"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownHeadingToId } from "@/lib/markdownHeadingId";

const LINK_CLASS = "font-medium text-indigo-600 underline-offset-2 hover:underline";

type MarkdownContentProps = {
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
    const id = markdownHeadingToId(text);
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
    if (href?.startsWith("#")) {
      return (
        <a href={href} className={LINK_CLASS}>
          {children}
        </a>
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
 * Markdown 本文をサイト共通デザインに合わせてレンダリングする。
 */
export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="space-y-6">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
