"use client";

import { useCallback, useState } from "react";
import {
  DEFAULT_FUSELY_PREFS,
  loadFuselyPrefs,
  saveDetectionPrefs,
  type DetectionPrefs,
} from "@/lib/preferences";

interface UseDetectionSettingsReturn {
  /** 現在の検出設定 */
  settings: DetectionPrefs;
  /** 検出設定を更新して localStorage に保存する */
  updateSettings: (next: DetectionPrefs) => void;
}

/**
 * 検出設定（fusely:prefs.detection）の読み書き
 */
export function useDetectionSettings(): UseDetectionSettingsReturn {
  const [settings, setSettings] = useState<DetectionPrefs>(() =>
    typeof window === "undefined" ? DEFAULT_FUSELY_PREFS.detection : loadFuselyPrefs().detection
  );

  const updateSettings = useCallback((next: DetectionPrefs) => {
    setSettings(next);
    saveDetectionPrefs(next);
  }, []);

  return { settings, updateSettings };
}
