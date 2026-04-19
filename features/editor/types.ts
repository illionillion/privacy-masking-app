/**
 * エディター機能の型定義
 */

/** マスキング対象領域の種別 */
export type MaskRegionType = "face" | "manual";

/** マスキング対象の矩形領域 */
export interface MaskRegion {
  /** 一意のID */
  id: string;
  /** 矩形のX座標 */
  x: number;
  /** 矩形のY座標 */
  y: number;
  /** 矩形の幅 */
  width: number;
  /** 矩形の高さ */
  height: number;
  /** 領域の有効/無効フラグ */
  isEnabled: boolean;
  /** 領域の種別（顔検出 or 手動追加） */
  type: MaskRegionType;
}

/** useEditor フックの戻り値 */
export interface UseEditorReturn {
  /** マスキング領域の一覧 */
  regions: MaskRegion[];
  /** 領域の有効/無効を切り替える */
  toggleRegion: (id: string) => void;
  /** 領域を追加する */
  addRegion: (region: Omit<MaskRegion, "id" | "isEnabled">) => void;
  /** 領域を削除する */
  removeRegion: (id: string) => void;
  /** すべての領域をリセットする */
  resetRegions: () => void;
}
