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
 * FAQ ページ用の連結アコーディオン。`<details>` / `<summary>` でキーボード操作にも対応する。
 */
export function FaqAccordion({ intro, items, footer }: FaqAccordionProps) {
  return (
    <div className="space-y-6">
      {intro.length > 0 && <LegalMarkdownContent content={intro} />}

      <div
        className={clsx([
          "overflow-hidden",
          "rounded-xl",
          "border border-zinc-200",
          "bg-white",
          "shadow-sm",
        ])}
      >
        {items.map((item) => (
          <details
            key={item.id}
            id={item.id}
            className={clsx(["group", "border-b border-zinc-200", "last:border-b-0"])}
          >
            <summary
              className={clsx([
                "flex",
                "cursor-pointer",
                "list-none",
                "items-center",
                "justify-between",
                "gap-4",
                "px-5",
                "py-4",
                "text-sm",
                "font-semibold",
                "text-zinc-900",
                "transition-colors",
                "duration-200",
                "hover:bg-zinc-50",
                "group-open:bg-indigo-50/70",
                "group-open:text-indigo-950",
                "focus-visible:outline",
                "focus-visible:outline-2",
                "focus-visible:outline-offset-[-2px]",
                "focus-visible:outline-indigo-600",
                "[&::-webkit-details-marker]:hidden",
              ])}
            >
              <span className="text-left leading-snug">{item.question}</span>
              <ChevronDown
                className={clsx([
                  "h-4",
                  "w-4",
                  "shrink-0",
                  "text-zinc-400",
                  "transition-transform",
                  "duration-300",
                  "ease-in-out",
                  "motion-reduce:transition-none",
                  "group-open:rotate-180",
                  "group-open:text-indigo-600",
                ])}
                aria-hidden="true"
              />
            </summary>
            <div
              className={clsx([
                "grid",
                "grid-rows-[0fr]",
                "transition-[grid-template-rows]",
                "duration-300",
                "ease-in-out",
                "motion-reduce:transition-none",
                "group-open:grid-rows-[1fr]",
              ])}
            >
              <div className="overflow-hidden">
                <div
                  className={clsx([
                    "border-t border-zinc-200",
                    "bg-zinc-50/80",
                    "px-5",
                    "pb-5",
                    "pt-4",
                    "text-sm",
                    "leading-relaxed",
                    "text-zinc-700",
                  ])}
                >
                  <LegalMarkdownContent content={item.answer} />
                </div>
              </div>
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
