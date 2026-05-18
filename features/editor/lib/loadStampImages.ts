import { STAMP_FILE_NAMES } from "../constants";

/** 公開URLのベースパス。サブパス配信時は `NEXT_PUBLIC_BASE_PATH` を設定する。 */
const PUBLIC_BASE_PATH = (() => {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (raw === "/" || raw.length === 0) return "";
  return `/${raw.replace(/^\/+|\/+$/g, "")}`;
})();

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
          img.src = `${PUBLIC_BASE_PATH}/stamps/${fileName}`;
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
