import type { MaskingImageItem } from "../types";

/** prepareGalleryItemsFromFiles の戻り値 */
export interface PrepareGalleryItemsResult {
  /** Blob 変換に成功した画像アイテム（files の順序を保持） */
  succeededItems: MaskingImageItem[];
  /** 各ファイルの Blob 変換結果（失敗も含む） */
  blobResults: PromiseSettledResult<MaskingImageItem>[];
}

/**
 * 全ファイルを ArrayBuffer 経由でメモリ上の Blob に変換し MaskingImageItem を生成する
 *
 * - File から直接 createObjectURL した URL はモバイルで ERR_UPLOAD_FILE_CHANGED が発生するため
 *   ArrayBuffer 経由で生成する。
 * - allSettled で個別失敗を吸収し、成功分のみ succeededItems に含める。
 *
 * @param files - アップロードされた画像ファイル一覧
 * @param uploadedAt - アップロード時刻（ID 生成用）
 * @param isMounted - コンポーネントがマウント中かどうか
 * @returns 変換結果
 */
export async function prepareGalleryItemsFromFiles(
  files: File[],
  uploadedAt: number,
  isMounted: () => boolean
): Promise<PrepareGalleryItemsResult> {
  const blobResults = await Promise.allSettled(
    files.map(async (file, index) => {
      const buffer = await file.arrayBuffer();
      if (!isMounted()) return Promise.reject(new Error("unmounted"));
      const memoryBlob = new Blob([buffer], { type: file.type });
      const imageUrl = URL.createObjectURL(memoryBlob);
      if (!isMounted()) {
        URL.revokeObjectURL(imageUrl);
        return Promise.reject(new Error("unmounted"));
      }
      const item: MaskingImageItem = {
        id: `${file.name}-${file.lastModified}-${file.size}-${uploadedAt}-${index}`,
        name: file.name,
        size: file.size,
        imageUrl,
        detections: [],
        ocrRegions: [],
        maskedBlobUrl: null,
        isProcessing: true,
        processingError: false,
      };
      return item;
    })
  );

  const succeededItems = blobResults.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : []
  );

  return { succeededItems, blobResults };
}
