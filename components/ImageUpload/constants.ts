/** 許可する画像ファイル形式（マスキング処理へ渡す最終形式） */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** HEIC / HEIF の MIME タイプ（アップロード時に JPEG へ変換する） */
export const HEIC_IMAGE_TYPES = ["image/heic", "image/heif"] as const;

/** ファイル選択ダイアログの accept 属性用 MIME タイプ */
export const UPLOAD_ACCEPT_IMAGE_TYPES = [...ACCEPTED_IMAGE_TYPES, ...HEIC_IMAGE_TYPES];

/** UI に表示する対応形式ラベル */
export const UPLOAD_IMAGE_FORMATS_LABEL = "JPEG / PNG / WebP / GIF / HEIC";

/** 最大ファイルサイズ (20MB) */
export const MAX_IMAGE_FILE_SIZE = 20 * 1024 * 1024;

/** 許可形式外ファイルのエラーメッセージ */
export const ACCEPTED_IMAGE_TYPES_ERROR =
  "JPEG / PNG / WebP / GIF / HEIC 形式の画像を選択してください";

/** HEIC 変換失敗時のエラーメッセージ */
export const HEIC_CONVERSION_ERROR = "HEIC 形式の画像を変換できませんでした";

/** HEIC 変換中のローディングメッセージ */
export const HEIC_CONVERSION_LOADING_MESSAGE = "HEIC を変換しています…";

/** Canvas 変換で許可する最大辺の長さ (px)。超過するとタブのメモリ不足を引き起こし得る */
export const MAX_CANVAS_DIMENSION = 8000;
