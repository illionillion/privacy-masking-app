"use client";

import { useEffect, useState } from "react";
import { loadStampImagesCached } from "@/features/editor/lib/loadStampImages";

/**
 * スタンプ画像を読み込み state として提供する
 *
 * @returns スタンプ画像の Map（キー: スタンプ ID）
 */
export function useStampImages(): Map<string, HTMLImageElement> {
  const [stampImages, setStampImages] = useState<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    let cancelled = false;
    void loadStampImagesCached()
      .then((map) => {
        if (!cancelled) setStampImages(map);
      })
      .catch((err: unknown) => {
        if (!cancelled) console.error("スタンプ画像の読み込みに失敗しました", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return stampImages;
}
