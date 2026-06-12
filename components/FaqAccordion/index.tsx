import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { LegalMarkdownContent } from "@/components/LegalMarkdownContent";
import type { FaqItem } from "@/lib/parseFaqContent";

type FaqAccordionProps = {
  intro: string;
  items: FaqItem[];
  footer: string;
};

/**
 * FAQ ページ用のアコーディオン。`<details>` / `<summary>` でキーボード操作にも対応する。
 */
export function FaqAccordion({ intro, items, footer }: FaqAccordionProps) {
  return (
    <div className="space-y-6">
      {intro.length > 0 && <LegalMarkdownContent content={intro} />}

      <div className="space-y-3" role="list">
        {items.map((item) => (
          <details
            key={item.id}
            id={item.id}
            role="listitem"
            className={clsx([
              "group",
              "overflow-hidden",
              "rounded-xl",
              "border border-zinc-200",
              "bg-white",
              "shadow-sm",
              "open:border-indigo-200",
              "open:ring-1",
              "open:ring-indigo-100",
            ])}
          >
            <summary
              className={clsx([
                "flex",
                "cursor-pointer",
                "list-none",
                "items-center",
                "justify-between",
                "gap-3",
                "px-4",
                "py-3.5",
                "text-sm",
                "font-semibold",
                "text-zinc-900",
                "transition-colors",
                "hover:bg-zinc-50",
                "focus-visible:outline",
                "focus-visible:outline-2",
                "focus-visible:outline-offset-[-2px]",
                "focus-visible:outline-indigo-600",
                "[&::-webkit-details-marker]:hidden",
              ])}
            >
              <span>{item.question}</span>
              <ChevronDown
                className={clsx([
                  "h-4",
                  "w-4",
                  "shrink-0",
                  "text-zinc-400",
                  "transition-transform",
                  "group-open:rotate-180",
                ])}
                aria-hidden="true"
              />
            </summary>
            <div className="border-t border-zinc-100 px-4 pb-4 pt-3 text-sm leading-relaxed text-zinc-700">
              <LegalMarkdownContent content={item.answer} />
            </div>
          </details>
        ))}
      </div>

      {footer.length > 0 && (
        <div className="pt-2">
          <LegalMarkdownContent content={footer} />
        </div>
      )}
    </div>
  );
}
