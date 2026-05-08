"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

/** LP 用のトップへ戻るボタン */
export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 320);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`fixed bottom-6 right-4 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full border border-indigo-300/70 bg-indigo-600/95 text-white shadow-lg backdrop-blur transition-all hover:scale-105 hover:bg-indigo-500 hover:text-white active:scale-95 sm:right-6 ${
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-2 opacity-0 pointer-events-none"
      }`}
      aria-label="ページ上部へ戻る"
    >
      <ChevronUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
