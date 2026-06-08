"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_FUSELY_PREFS,
  loadFuselyPrefs,
  saveDetectionPrefs,
  type DetectionPrefs,
} from "@/lib/preferences";

interface DetectionSettingsState {
  settings: DetectionPrefs;
  isLoaded: boolean;
}

const SERVER_STATE: DetectionSettingsState = {
  settings: DEFAULT_FUSELY_PREFS.detection,
  isLoaded: false,
};

let clientState: DetectionSettingsState | null = null;
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
function getClientState(): DetectionSettingsState {
  if (clientState === null) {
    clientState = {
      settings: loadFuselyPrefs().detection,
      isLoaded: true,
    };
  }
  return clientState;
}

/** useSyncExternalStore 用スナップショット（クライアント） */
function getSnapshot(): DetectionSettingsState {
  return getClientState();
}

/** useSyncExternalStore 用スナップショット（SSR・ハイドレーション） */
function getServerSnapshot(): DetectionSettingsState {
  return SERVER_STATE;
}

interface UseDetectionSettingsReturn {
  /** 現在の検出設定 */
  settings: DetectionPrefs;
  /** localStorage からの復元が完了したか */
  isLoaded: boolean;
  /** 検出設定を更新して localStorage に保存する */
  updateSettings: (next: DetectionPrefs) => void;
}

/**
 * 検出設定（fusely:prefs.detection）の読み書き
 *
 * SSR 時は未読み込み状態で描画し、クライアントハイドレーション後に localStorage を復元する。
 */
export function useDetectionSettings(): UseDetectionSettingsReturn {
  const { settings, isLoaded } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const updateSettings = useCallback((next: DetectionPrefs) => {
    clientState = { settings: next, isLoaded: true };
    saveDetectionPrefs(next);
    emitChange();
  }, []);

  return { settings, isLoaded, updateSettings };
}
