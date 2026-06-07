/**
 * 画像URLから HTMLImageElement を生成する
 *
 * @param src - 画像の Data URL または Blob URL
 * @returns 読み込み済みのHTMLImageElement
 */
export const loadImageElement = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    img.src = src;
  });
};
