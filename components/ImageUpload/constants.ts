/** 許可する画像ファイル形式 */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** 最大ファイルサイズ (20MB) */
export const MAX_IMAGE_FILE_SIZE = 20 * 1024 * 1024;

/** 許可形式外ファイルのエラーメッセージ */
export const ACCEPTED_IMAGE_TYPES_ERROR = "JPEG / PNG / WebP / GIF 形式の画像を選択してください";

/** Canvas 変換で許可する最大辺の長さ (px)。超過するとタブのメモリ不足を引き起こし得る */
export const MAX_CANVAS_DIMENSION = 8000;
