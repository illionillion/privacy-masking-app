import type { CustomMaskTerm, DetectionPrefs } from "@/lib/preferences";

/**
 * マスク語句設定のサマリ文字列を返す
 *
 * @param terms - 登録語句一覧
 * @param options - 表示オプション
 * @param options.ocrEnabled - テキスト自動検出（OCR）が有効か
 */
export function formatCustomMaskTermsSummary(
  terms: readonly CustomMaskTerm[],
  options?: { ocrEnabled?: boolean }
): string {
  if (options?.ocrEnabled === false) {
    return "利用不可（OCR オフ）";
  }
  if (terms.length === 0) {
    return "未登録";
  }
  const enabledCount = terms.filter((term) => term.enabled).length;
  return `${terms.length}件（有効 ${enabledCount}件）`;
}

/**
 * 検出設定のサマリ文字列を返す
 *
 * @param settings - 検出設定
 */
export function formatDetectionSettingsSummary(settings: DetectionPrefs): string {
  const faceLabel = settings.autoDetectFace ? "顔: 自動" : "顔: 手動";
  const ocrLabel = settings.autoDetectOcr ? "OCR: 自動" : "OCR: 手動";
  return `${faceLabel} · ${ocrLabel}`;
}

/**
 * 設定に応じた検出完了トースト用ラベル（1 件分）
 *
 * @param settings - 検出設定
 * @param fileName - ファイル名
 * @param context - アップロード直後か再検出か
 */
export function getDetectionCompleteMessage(
  settings: DetectionPrefs,
  fileName: string,
  context: "upload" | "redetect" = "upload"
): string | null {
  if (!settings.autoDetectFace && !settings.autoDetectOcr) {
    if (context === "upload") {
      return `${fileName} を追加しました（自動検出なし）`;
    }
    return null;
  }

  const verb = context === "redetect" ? "再検出" : "検出";

  if (settings.autoDetectFace && settings.autoDetectOcr) {
    return `${fileName} の${verb}が完了しました`;
  }
  if (settings.autoDetectFace) {
    return `${fileName} の顔${verb}が完了しました`;
  }
  return `${fileName} のテキスト${verb}が完了しました`;
}

/**
 * 複数件処理完了時のバッチトースト用ラベル
 *
 * @param settings - 検出設定
 * @param count - 成功件数
 */
export function getDetectionBatchCompleteMessage(
  settings: DetectionPrefs,
  count: number
): string | null {
  if (count <= 1) {
    return null;
  }
  if (settings.autoDetectFace || settings.autoDetectOcr) {
    return `${count} 件の検出が完了しました`;
  }
  return `${count} 件の画像を追加しました`;
}
