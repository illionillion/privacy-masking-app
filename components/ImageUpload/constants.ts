import { ACCEPTED_IMAGE_TYPES, HEIC_IMAGE_TYPES } from "@/lib/image/constants";

export {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_IMAGE_TYPES_ERROR,
  HEIC_CONVERSION_ERROR,
  HEIC_IMAGE_TYPES,
  MAX_CANVAS_DIMENSION,
  MAX_IMAGE_FILE_SIZE,
  URL_DROP_UNSUPPORTED_IMAGE_TYPES_ERROR,
} from "@/lib/image/constants";

/** ファイル選択ダイアログの accept 属性用 MIME タイプ */
export const UPLOAD_ACCEPT_IMAGE_TYPES = [...ACCEPTED_IMAGE_TYPES, ...HEIC_IMAGE_TYPES];

/** UI に表示する対応形式ラベル */
export const UPLOAD_IMAGE_FORMATS_LABEL = "JPEG / PNG / WebP / GIF / HEIC";

/** HEIC 変換中のローディングメッセージ */
export const HEIC_CONVERSION_LOADING_MESSAGE = "HEIC を変換しています…";
