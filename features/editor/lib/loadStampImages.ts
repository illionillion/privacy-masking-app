import { STAMP_FILE_NAMES } from "../constants";
import { buildPublicAssetPath } from "@/lib/buildPublicAssetPath";

/**
 * スタンプ画像を読み込み Map に格納する
 *
 * @returns ファイル名をキーにした HTMLImageElement の Map
 */
async function loadStampImages(): Promise<Map<string, HTMLImageElement>> {
  const map = new Map<string, HTMLImageElement>();
  await Promise.allSettled(
    STAMP_FILE_NAMES.map(
      (fileName) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            map.set(fileName, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = buildPublicAssetPath(`stamps/${fileName}`);
        })
    )
  );
  return map;
}

/** スタンプ画像読み込みの共有キャッシュ */
let stampImagesPromise: Promise<Map<string, HTMLImageElement>> | null = null;

/**
 * スタンプ画像を一度だけ読み込み、以降は同じ Promise を返す
 */
export function loadStampImagesCached(): Promise<Map<string, HTMLImageElement>> {
  stampImagesPromise ??= loadStampImages();
  return stampImagesPromise;
}

/** テスト用: スタンプ画像キャッシュをリセットする */
export function resetStampImagesCacheForTests(): void {
  stampImagesPromise = null;
}
