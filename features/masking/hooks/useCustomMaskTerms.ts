"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_FUSELY_PREFS,
  getEnabledCustomMaskTexts,
  loadFuselyPrefs,
  sanitizeCustomMaskTermsForSave,
  saveCustomMaskTerms,
  type CustomMaskTerm,
} from "@/lib/preferences";

interface CustomMaskTermsState {
  terms: CustomMaskTerm[];
  /** クライアントで localStorage 復元済み（SSR・ハイドレーション中は false） */
  isReady: boolean;
}

const SERVER_STATE: CustomMaskTermsState = {
  terms: DEFAULT_FUSELY_PREFS.customMaskTerms,
  isReady: false,
};

let clientState: CustomMaskTermsState | null = null;
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
function getClientState(): CustomMaskTermsState {
  if (clientState === null) {
    clientState = {
      terms: loadFuselyPrefs().customMaskTerms,
      isReady: true,
    };
  }
  return clientState;
}

/** useSyncExternalStore 用スナップショット（クライアント） */
function getSnapshot(): CustomMaskTermsState {
  return getClientState();
}

/** useSyncExternalStore 用スナップショット（SSR・ハイドレーション） */
function getServerSnapshot(): CustomMaskTermsState {
  return SERVER_STATE;
}

interface UseCustomMaskTermsReturn {
  /** 登録済みマスク語句 */
  terms: CustomMaskTerm[];
  /** クライアントで localStorage 復元済みか */
  isReady: boolean;
  /** 有効な語句テキスト一覧（OCR 検出用） */
  enabledTexts: string[];
  /** 語句一覧を更新して localStorage に保存する */
  updateTerms: (next: CustomMaskTerm[]) => void;
}

/**
 * マスク語句（fusely:prefs.customMaskTerms）の読み書き
 */
export function useCustomMaskTerms(): UseCustomMaskTermsReturn {
  const { terms, isReady } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const updateTerms = useCallback((next: CustomMaskTerm[]) => {
    const sanitized = sanitizeCustomMaskTermsForSave(next);
    clientState = { terms: sanitized, isReady: true };
    saveCustomMaskTerms(sanitized);
    emitChange();
  }, []);

  const enabledTexts = getEnabledCustomMaskTexts(terms);

  return { terms, isReady, enabledTexts, updateTerms };
}
