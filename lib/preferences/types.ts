/** 顔・OCR の自動検出設定 */
export interface DetectionPrefs {
  /** アップロード・再検出で顔を自動検出する */
  autoDetectFace: boolean;
  /** アップロード・再検出で OCR を自動実行する */
  autoDetectOcr: boolean;
}

/** fusely:prefs に保存する設定オブジェクト */
export interface FuselyPrefs {
  version: number;
  detection: DetectionPrefs;
}

/** デフォルト設定（v1） */
export const DEFAULT_FUSELY_PREFS: FuselyPrefs = {
  version: 1,
  detection: {
    autoDetectFace: true,
    autoDetectOcr: true,
  },
};
