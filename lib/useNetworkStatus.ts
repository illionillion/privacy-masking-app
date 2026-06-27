"use client";

import { useSyncExternalStore } from "react";

/**
 * `online` / `offline` イベントを購読する。
 *
 * @param callback - ネットワーク状態が変わったときのコールバック
 */
function subscribeToNetworkStatus(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/** クライアントのオンライン状態を返す */
function getOnlineSnapshot(): boolean {
  return navigator.onLine;
}

/** SSR 時はオフラインバナーのチラつきを避けるためオンライン扱いにする */
function getOnlineServerSnapshot(): boolean {
  return true;
}

/**
 * ブラウザのオンライン / オフライン状態を返すフック。
 *
 * SSR では `isOnline: true` を返し、クライアントで確定した値に更新する。
 */
export function useNetworkStatus(): { isOnline: boolean; isOffline: boolean } {
  const isOnline = useSyncExternalStore(
    subscribeToNetworkStatus,
    getOnlineSnapshot,
    getOnlineServerSnapshot
  );
  return { isOnline, isOffline: !isOnline };
}
