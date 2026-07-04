"use client";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useCallback, useState } from "react";
import { MarkdownContent } from "@/components/MarkdownContent";
import type { FaqItem } from "@/lib/parseFaqContent";

type FaqAccordionProps = {
  intro: string;
  items: FaqItem[];
  footer: string;
};

type FaqAccordionItemProps = {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
};

/**
 * FAQ の1項目。開閉状態を React で制御し、閉じるときも CSS トランジションが効くようにする。
 */
function FaqAccordionItem({ item, isOpen, onToggle }: FaqAccordionItemProps) {
  const triggerId = `faq-trigger-${item.id}`;
  const panelId = `faq-panel-${item.id}`;

  return (
    <div id={item.id} className={clsx(["border-b border-zinc-200", "last:border-b-0"])}>
      <button
        type="button"
        id={triggerId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className={clsx([
          "flex",
          "w-full",
          "cursor-pointer",
          "items-center",
          "justify-between",
          "gap-4",
          "px-5",
          "py-4",
          "text-left",
          "text-sm",
          "font-semibold",
          "text-zinc-900",
          "transition-colors",
          "duration-200",
          "hover:bg-zinc-50",
          "focus-visible:outline",
          "focus-visible:outline-2",
          "focus-visible:outline-offset-[-2px]",
          "focus-visible:outline-indigo-600",
          isOpen && ["bg-indigo-50/70", "text-indigo-950"],
        ])}
      >
        <span className="leading-snug">{item.question}</span>
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
            isOpen && ["rotate-180", "text-indigo-600"],
          ])}
          aria-hidden="true"
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        aria-hidden={!isOpen}
        {...(!isOpen ? { inert: true } : {})}
        className={clsx([
          "grid",
          "transition-[grid-template-rows]",
          "duration-300",
          "ease-in-out",
          "motion-reduce:transition-none",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
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
            <MarkdownContent content={item.answer} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * FAQ ページ用の連結アコーディオン。
 */
export function FaqAccordion({ intro, items, footer }: FaqAccordionProps) {
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set());

  const toggleItem = useCallback((id: string) => {
    setOpenIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <div className="space-y-6">
      {intro.length > 0 && <MarkdownContent content={intro} />}

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
          <FaqAccordionItem
            key={item.id}
            item={item}
            isOpen={openIds.has(item.id)}
            onToggle={() => {
              toggleItem(item.id);
            }}
          />
        ))}
      </div>

      {footer.length > 0 && (
        <div className="pt-2">
          <MarkdownContent content={footer} />
        </div>
      )}
    </div>
  );
}
