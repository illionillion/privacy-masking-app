/** 顔・OCR の自動検出設定 */
export interface DetectionPrefs {
  /** アップロード・再検出で顔を自動検出する */
  autoDetectFace: boolean;
  /** アップロード・再検出で OCR を自動実行する */
  autoDetectOcr: boolean;
}

/** ユーザー登録のマスク語句 */
export interface CustomMaskTerm {
  /** 一覧内で一意な ID */
  id: string;
  /** マスク対象の文字列 */
  text: string;
  /** 有効フラグ（オフのときは OCR 検出しない） */
  enabled: boolean;
}

/** fusely:prefs に保存する設定オブジェクト */
export interface FuselyPrefs {
  version: number;
  detection: DetectionPrefs;
  customMaskTerms: CustomMaskTerm[];
}

/** デフォルト設定（v2） */
export const DEFAULT_FUSELY_PREFS: FuselyPrefs = {
  version: 2,
  detection: {
    autoDetectFace: true,
    autoDetectOcr: true,
  },
  customMaskTerms: [],
};
