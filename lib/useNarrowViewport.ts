import { useSyncExternalStore } from "react";

/** SP 判定のブレークポイント（Tailwind の `md` と同じ 768px 未満） */
const NARROW_BREAKPOINT = "(max-width: 767px)";

function subscribeToNarrow(callback: () => void): () => void {
  const mq = window.matchMedia(NARROW_BREAKPOINT);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(NARROW_BREAKPOINT).matches;
}

/** SSR 時はチラつき防止のため `false` を返す */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * ビューポート幅が Tailwind の `md`（768px）未満かどうかを返すフック
 *
 * SSR では `false` を返し、クライアントで確定した値に更新する。
 * @returns 幅が 767px 以下のとき `true`
 */
export function useNarrowViewport(): boolean {
  return useSyncExternalStore(subscribeToNarrow, getSnapshot, getServerSnapshot);
}
