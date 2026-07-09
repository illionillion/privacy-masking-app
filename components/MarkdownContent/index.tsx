"use client";

/* eslint-disable @next/next/no-img-element -- Markdown 本文の画像は記事ごとに表示サイズを変えるため通常の img を使う。 */

import Link from "next/link";
import clsx from "clsx";
import { Maximize2, X } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import { createPortal } from "react-dom";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import { markdownHeadingToId } from "@/lib/markdownHeadingId";
import { extractMarkdownH2Headings } from "@/lib/extractMarkdownH2Headings";

const LINK_CLASS = "font-medium text-indigo-600 underline-offset-2 hover:underline";
const DETAILS_DIRECTIVE_PATTERN = /^(:{3,})details[ \t]+(.+)$/gm;
const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->/g;
const IMAGE_SIZE_HASHES = ["small", "medium"] as const;

type MarkdownContentProps = {
  content: string;
};

type MarkdownImageSize = (typeof IMAGE_SIZE_HASHES)[number] | "default";

type MarkdownImageProps = {
  src: string | undefined;
  alt: string | undefined;
  size: MarkdownImageSize;
};

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

function getImageLabel(alt: string | undefined): string {
  const trimmedAlt = alt?.trim();
  return trimmedAlt && trimmedAlt.length > 0 ? trimmedAlt : "画像";
}

function getImageSizeClass(size: MarkdownImageSize): string {
  if (size === "small") {
    return "max-w-48";
  }
  if (size === "medium") {
    return "max-w-sm";
  }
  return "max-w-full";
}

/**
 * Markdown 本文内の画像を表示し、クリック時に拡大モーダルを開く。
 */
function MarkdownImage({ src, alt, size }: MarkdownImageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const captionId = useId();
  const label = getImageLabel(alt);
  const sizeClass = getImageSizeClass(size);
  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);
  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const prevOverflow = document.body.style.overflow;
    const prevFocusedElement = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      prevFocusedElement?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeModal, isOpen]);

  const handleKeyDownDialog = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") {
      return;
    }

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  if (!src) {
    return null;
  }

  return (
    <>
      <span className={clsx(["group relative mx-auto block w-fit max-w-full", sizeClass])}>
        <button
          type="button"
          aria-label={`${label}を拡大表示`}
          onClick={openModal}
          className="block cursor-zoom-in rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <img
            src={src}
            alt={alt ?? ""}
            className={clsx([
              "h-auto",
              "rounded-lg",
              "border border-zinc-200",
              "shadow-sm",
              sizeClass,
            ])}
            loading="lazy"
          />
        </button>
        <button
          type="button"
          aria-label={`${label}をモーダルで開く`}
          onClick={openModal}
          className={clsx([
            "absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full",
            "bg-zinc-950/70 text-white opacity-0 shadow-sm transition-opacity",
            "hover:bg-zinc-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
            "group-hover:opacity-100 group-focus-within:opacity-100",
          ])}
        >
          <Maximize2 aria-hidden="true" className="size-4" />
        </button>
      </span>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onKeyDown={handleKeyDownDialog}
            >
              <div
                role="presentation"
                className="absolute inset-0 cursor-zoom-out bg-black/70"
                onClick={closeModal}
              />
              <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={captionId}
                className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col gap-3"
              >
                <div className="flex justify-end">
                  <button
                    ref={closeButtonRef}
                    type="button"
                    aria-label="拡大画像を閉じる"
                    onClick={closeModal}
                    className="inline-flex size-10 items-center justify-center rounded-full bg-white text-zinc-800 shadow-lg transition-colors hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <X aria-hidden="true" className="size-5" />
                  </button>
                </div>
                <div className="flex min-h-0 flex-col items-center gap-3">
                  <img
                    src={src}
                    alt={alt ?? ""}
                    className="max-h-[calc(100dvh-9rem)] max-w-full rounded-lg bg-white object-contain shadow-2xl"
                  />
                  <p id={captionId} className="max-w-full px-2 text-center text-sm text-white/90">
                    {label}
                  </p>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
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

const baseMarkdownComponents: Components = {
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
    return <MarkdownImage src={image.src} alt={alt} size={image.size} />;
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
 * h2 用 id 一覧に沿って Markdown コンポーネントを組み立てる。
 */
function createMarkdownComponents(h2Ids: string[]): Components {
  let h2Index = 0;

  return {
    ...baseMarkdownComponents,
    h2: ({ children }) => {
      const text = getHeadingText(children);
      const id = h2Ids[h2Index] ?? markdownHeadingToId(text);
      h2Index += 1;

      return (
        <h2 id={id} className="scroll-mt-24 text-base font-semibold text-zinc-900">
          {children}
        </h2>
      );
    },
  };
}

/**
 * Markdown 本文をサイト共通デザインに合わせてレンダリングする。
 */
export function MarkdownContent({ content }: MarkdownContentProps) {
  const normalizedContent = normalizeDetailsDirective(stripMarkdownComments(content));
  const h2Ids = useMemo(
    () => extractMarkdownH2Headings(content).map((heading) => heading.id),
    [content]
  );
  const components = useMemo(() => createMarkdownComponents(h2Ids), [h2Ids]);

  return (
    <div className="space-y-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkDirective, remarkDetailsDirective]}
        components={components}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
}
