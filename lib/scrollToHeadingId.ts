"use client";

/**
 * 見出し id へスクロールする。sticky Header を考慮するため h2 の scroll-margin に任せる。
 */
export function scrollToHeadingId(id: string): boolean {
  const element = document.getElementById(id);
  if (!element) {
    return false;
  }

  element.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

/**
 * 現在 URL のハッシュを見出し id に更新する。
 */
export function setHeadingHash(id: string): void {
  const nextHash = `#${id}`;
  if (window.location.hash !== nextHash) {
    window.history.replaceState(null, "", nextHash);
  }
}

const MAX_SCROLL_ATTEMPTS = 60;

/**
 * ハッシュを先に更新し、見出し DOM の出現を待ってスクロールする。
 */
export function navigateToHeadingId(id: string): void {
  setHeadingHash(id);

  let attempts = 0;

  const tryScroll = (): void => {
    if (scrollToHeadingId(id)) {
      return;
    }

    attempts += 1;
    if (attempts < MAX_SCROLL_ATTEMPTS) {
      requestAnimationFrame(tryScroll);
    }
  };

  tryScroll();
}
