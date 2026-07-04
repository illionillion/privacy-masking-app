"use client";

import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import { markdownHeadingToId } from "@/lib/markdownHeadingId";

const LINK_CLASS = "font-medium text-indigo-600 underline-offset-2 hover:underline";
const DETAILS_DIRECTIVE_PATTERN = /^(:{3,})details[ \t]+(.+)$/gm;
const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->/g;
const IMAGE_SIZE_HASHES = ["small", "medium"] as const;

type MarkdownContentProps = {
  content: string;
};

type MarkdownImageSize = (typeof IMAGE_SIZE_HASHES)[number] | "default";

type MarkdownAstNode = {
  type: string;
  name?: string;
  value?: string;
  children?: MarkdownAstNode[];
  data?: {
    directiveLabel?: boolean;
    hName?: string;
    hProperties?: Record<string, string | string[]>;
  };
};

/**
 * Qiita 風の `:::details タイトル` を remark-directive のラベル構文へ正規化する。
 */
function normalizeDetailsDirective(content: string): string {
  return content.replace(DETAILS_DIRECTIVE_PATTERN, (_, fence: string, rawTitle: string) => {
    const title = rawTitle.trim();
    return title.length > 0 ? `${fence}details[${title}]` : `${fence}details`;
  });
}

/**
 * 執筆メモ用の HTML コメントを公開本文から取り除く。
 */
function stripMarkdownComments(content: string): string {
  return content.replace(HTML_COMMENT_PATTERN, "");
}

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

/**
 * 画像 URL の hash から表示サイズ指定を取り出す。
 */
function parseMarkdownImageSrc(src: string | undefined): {
  src: string | undefined;
  size: MarkdownImageSize;
} {
  if (!src) {
    return { src, size: "default" };
  }

  const [path, hash] = src.split("#");
  if (hash && IMAGE_SIZE_HASHES.includes(hash as (typeof IMAGE_SIZE_HASHES)[number])) {
    return {
      src: path,
      size: hash as MarkdownImageSize,
    };
  }

  return {
    src,
    size: "default",
  };
}

/**
 * `:::details[タイトル] ... :::` を details/summary に変換する。
 */
function remarkDetailsDirective() {
  return (tree: MarkdownAstNode) => {
    visitMarkdownAst(tree, (node) => {
      if (node.type !== "containerDirective" || node.name !== "details") {
        return;
      }

      const [firstChild] = node.children ?? [];
      const hasLabel = firstChild?.data?.directiveLabel === true;

      if (hasLabel && firstChild) {
        firstChild.data = {
          ...firstChild.data,
          hName: "summary",
          hProperties: {
            className: "cursor-pointer font-medium text-zinc-900",
          },
        };
      } else {
        node.children = [
          {
            type: "paragraph",
            data: {
              hName: "summary",
              hProperties: {
                className: "cursor-pointer font-medium text-zinc-900",
              },
            },
            children: [{ type: "text", value: "詳細を表示" }],
          },
          ...(node.children ?? []),
        ];
      }

      node.data = {
        ...node.data,
        hName: "details",
        hProperties: {
          className: "rounded-lg border border-zinc-200 bg-white p-4",
        },
      };
    });
  };
}

function visitMarkdownAst(node: MarkdownAstNode, visitor: (node: MarkdownAstNode) => void): void {
  visitor(node);
  node.children?.forEach((child) => {
    visitMarkdownAst(child, visitor);
  });
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
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse overflow-hidden rounded-lg border border-zinc-200 text-left">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-zinc-50 text-zinc-900">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-zinc-200 px-3 py-2 text-sm font-semibold">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-zinc-200 px-3 py-3 align-top text-sm">{children}</td>
  ),
  img: ({ src, alt }) => {
    const image = parseMarkdownImageSrc(typeof src === "string" ? src : undefined);
    return (
      // Markdown 本文内の画像はサイズが記事ごとに変わるため、通常の img として表示する。
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image.src}
        alt={alt ?? ""}
        className={clsx([
          "mx-auto",
          "h-auto",
          "rounded-lg",
          "border border-zinc-200",
          "shadow-sm",
          image.size === "small" && "max-w-48",
          image.size === "medium" && "max-w-sm",
          image.size === "default" && "max-w-full",
        ])}
        loading="lazy"
      />
    );
  },
  a: ({ href, children }) => {
    if (href?.startsWith("/") && !href.startsWith("//")) {
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
  const normalizedContent = normalizeDetailsDirective(stripMarkdownComments(content));

  return (
    <div className="space-y-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkDirective, remarkDetailsDirective]}
        components={markdownComponents}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
