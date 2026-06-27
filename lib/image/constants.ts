/** 許可する画像ファイル形式（マスキング処理へ渡す最終形式） */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** HEIC / HEIF の MIME タイプ（アップロード時に JPEG へ変換する） */
export const HEIC_IMAGE_TYPES = ["image/heic", "image/heif"] as const;

/** 最大ファイルサイズ (20MB) */
export const MAX_IMAGE_FILE_SIZE = 20 * 1024 * 1024;

/** 許可形式外ファイルのエラーメッセージ */
export const ACCEPTED_IMAGE_TYPES_ERROR =
  "JPEG / PNG / WebP / GIF / HEIC 形式の画像を選択してください";

/** HEIC 変換失敗時のエラーメッセージ */
export const HEIC_CONVERSION_ERROR = "HEIC 形式の画像を変換できませんでした";

/** ファイルサイズ超過時のエラーメッセージ */
export const FILE_SIZE_EXCEEDED_ERROR = "ファイルサイズは20MB以下にしてください";

/** アップロード正規化の想定外エラー時のフォールバックメッセージ */
export const UPLOAD_NORMALIZATION_ERROR = "画像の読み込みに失敗しました";

/** Canvas 変換で許可する最大辺の長さ (px)。超過するとタブのメモリ不足を引き起こし得る */
export const MAX_CANVAS_DIMENSION = 8000;
