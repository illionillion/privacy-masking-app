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
  /** クライアントで localStorage 復元済み（SSR・ハイドレーション中は false） */
  isReady: boolean;
}

const SERVER_STATE: DetectionSettingsState = {
  settings: DEFAULT_FUSELY_PREFS.detection,
  isReady: false,
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
      isReady: true,
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
  /** クライアントで localStorage 復元済みか（遅延表示のトリガー用。遅延自体は UI 層の責務） */
  isReady: boolean;
  /** 検出設定を更新して localStorage に保存する */
  updateSettings: (next: DetectionPrefs) => void;
}

/**
 * 検出設定（fusely:prefs.detection）の読み書き
 *
 * useSyncExternalStore で SSR とハイドレーションを揃え、復元後は即座に settings を利用可能にする。
 */
export function useDetectionSettings(): UseDetectionSettingsReturn {
  const { settings, isReady } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const updateSettings = useCallback((next: DetectionPrefs) => {
    clientState = { settings: next, isReady: true };
    saveDetectionPrefs(next);
    emitChange();
  }, []);

  return { settings, isReady, updateSettings };
}
