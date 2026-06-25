"use client";

import { useEffect } from "react";

/**
 * 本番ビルド時に生成される Service Worker を登録する。
 */
export function SerwistRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    void navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }, []);

  return null;
}
