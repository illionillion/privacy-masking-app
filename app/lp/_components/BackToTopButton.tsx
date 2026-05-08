"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

/** LP 用のトップへ戻るボタン */
export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const nextIsVisible = window.scrollY > 320;
      setIsVisible((prevIsVisible) =>
        prevIsVisible === nextIsVisible ? prevIsVisible : nextIsVisible
      );
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="fixed bottom-6 right-4 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full border border-indigo-300/70 bg-indigo-600/95 text-white shadow-lg backdrop-blur transition-all hover:scale-105 hover:bg-indigo-500 hover:text-white active:scale-95 sm:right-6"
      aria-label="ページ上部へ戻る"
    >
      <ChevronUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
