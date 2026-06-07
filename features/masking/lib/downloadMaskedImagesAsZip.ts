import { zip } from "fflate";
import { type MaskingImageItem, createDownloadFileName } from "../types";

/**
 * 描画済み画像をすべて ZIP にまとめてダウンロードする
 *
 * @param images - ギャラリー内の全画像
 * @param onError - ZIP 生成失敗時のコールバック
 */
export function downloadMaskedImagesAsZip(images: MaskingImageItem[], onError?: () => void): void {
  const downloadableImages = images.filter(
    (image) => image.maskedBlobUrl !== null && !image.isProcessing
  );
  if (downloadableImages.length === 0) return;

  const fetchAll = downloadableImages.map(async (image) => {
    const res = await fetch(image.maskedBlobUrl as string);
    if (!res.ok) {
      throw new Error(`Failed to fetch masked image: ${image.name}`);
    }
    const buffer = await res.arrayBuffer();
    return { name: createDownloadFileName(image.name), data: new Uint8Array(buffer) };
  });

  void Promise.allSettled(fetchAll).then((results) => {
    const entries = results.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : []
    );

    if (entries.length === 0) return;

    /** 同名ファイルが複数ある場合に連番サフィックスを付与 */
    const nameCounts = new Map<string, number>();
    const fileMap: Record<string, Uint8Array> = {};

    for (const entry of entries) {
      const count = nameCounts.get(entry.name) ?? 0;
      nameCounts.set(entry.name, count + 1);
      const uniqueName =
        count === 0 ? entry.name : entry.name.replace(/-masked\.png$/, `-masked-${count}.png`);
      fileMap[uniqueName] = entry.data;
    }

    zip(fileMap, (err, data) => {
      if (err) {
        console.error("ZIPの生成に失敗しました", err);
        onError?.();
        return;
      }
      const blob = new Blob([data as Uint8Array<ArrayBuffer>], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "masked-images.zip";
      anchor.click();
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 0);
    });
  });
}
