import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_IMAGE_TYPES_ERROR,
  HEIC_CONVERSION_ERROR,
  MAX_IMAGE_FILE_SIZE,
} from "@/components/ImageUpload/constants";
import { convertHeicToJpeg } from "./convertHeicToJpeg";
import { isHeicFile } from "./isHeicFile";

/** normalizeUploadFiles の成功結果 */
export interface NormalizeUploadFilesSuccess {
  ok: true;
  files: File[];
}

/** normalizeUploadFiles の失敗結果 */
export interface NormalizeUploadFilesFailure {
  ok: false;
  error: string;
}

/** normalizeUploadFiles の戻り値 */
export type NormalizeUploadFilesResult = NormalizeUploadFilesSuccess | NormalizeUploadFilesFailure;

/**
 * アップロード対象ファイルを検証し、HEIC は JPEG に変換してから返す
 *
 * ImageUpload とクリップボード貼り付けで共通利用する。
 *
 * @param files - 検証・正規化対象の File 配列
 * @returns 正規化済みファイル、またはエラーメッセージ
 */
export async function normalizeUploadFiles(files: File[]): Promise<NormalizeUploadFilesResult> {
  const validFiles: File[] = [];
  let validationError: string | null = null;

  for (const file of files) {
    if (file.size > MAX_IMAGE_FILE_SIZE) {
      validationError = "ファイルサイズは20MB以下にしてください";
      continue;
    }

    if (isHeicFile(file)) {
      try {
        validFiles.push(await convertHeicToJpeg(file));
      } catch {
        validationError = HEIC_CONVERSION_ERROR;
      }
      continue;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      validationError = ACCEPTED_IMAGE_TYPES_ERROR;
      continue;
    }

    validFiles.push(file);
  }

  if (validFiles.length > 0) {
    return { ok: true, files: validFiles };
  }

  return { ok: false, error: validationError ?? ACCEPTED_IMAGE_TYPES_ERROR };
}
