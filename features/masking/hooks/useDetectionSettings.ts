"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_FUSELY_PREFS,
  loadFuselyPrefs,
  saveDetectionPrefs,
  type DetectionPrefs,
} from "@/lib/preferences";

let clientSettings: DetectionPrefs | null = null;
const listeners = new Set<() => void>();

/**
 * @param listener - 変更通知コールバック
 */
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 購読者へ変更を通知する */
function emitChange(): void {
  listeners.forEach((listener) => listener());
}

/** クライアント側のキャッシュを取得（初回のみ localStorage から復元） */
function getClientSettings(): DetectionPrefs {
  if (clientSettings === null) {
    clientSettings = loadFuselyPrefs().detection;
  }
  return clientSettings;
}

/** useSyncExternalStore 用スナップショット（クライアント） */
function getSnapshot(): DetectionPrefs {
  return getClientSettings();
}

/** useSyncExternalStore 用スナップショット（SSR・ハイドレーション） */
function getServerSnapshot(): DetectionPrefs {
  return DEFAULT_FUSELY_PREFS.detection;
}

interface UseDetectionSettingsReturn {
  /** 現在の検出設定 */
  settings: DetectionPrefs;
  /** 検出設定を更新して localStorage に保存する */
  updateSettings: (next: DetectionPrefs) => void;
}

/**
 * 検出設定（fusely:prefs.detection）の読み書き
 *
 * useSyncExternalStore で SSR とクライアントの初回描画を揃え、ハイドレーション後に localStorage を反映する。
 */
export function useDetectionSettings(): UseDetectionSettingsReturn {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const updateSettings = useCallback((next: DetectionPrefs) => {
    clientSettings = next;
    saveDetectionPrefs(next);
    emitChange();
  }, []);

  return { settings, updateSettings };
}
