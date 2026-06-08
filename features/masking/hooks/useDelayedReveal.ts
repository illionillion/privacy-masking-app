"use client";

import { useEffect, useState } from "react";

/** 検出設定バーを表示するまでの最低待機（チラつき抑止・応急措置） */
export const DETECTION_SETTINGS_BAR_REVEAL_MS = 200;

/**
 * ready が true になってから delayMs 経過後に true を返す（表示専用）
 *
 * @param ready - 表示してよい内容が揃ったか
 * @param delayMs - 遅延ミリ秒
 */
export function useDelayedReveal(ready: boolean, delayMs: number): boolean {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const id = window.setTimeout(() => setRevealed(true), delayMs);
    return () => window.clearTimeout(id);
  }, [ready, delayMs]);

  return ready && revealed;
}
