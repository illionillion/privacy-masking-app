/**
 * HEIC / HEIF ファイルをブラウザ内で JPEG に変換する
 *
 * `heic2any` は WASM ベースでバンドルが大きいため、呼び出し時にのみ動的 import する。
 * 変換処理はクライアント完結で、画像データをサーバーへ送信しない。
 *
 * @param file - 変換元の HEIC / HEIF ファイル
 * @returns JPEG 形式の File
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  const { default: heic2any } = await import("heic2any");
  const conversionResult = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });

  const blob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
  if (!(blob instanceof Blob)) {
    throw new Error("HEIC の変換に失敗しました");
  }

  const baseName = file.name.replace(/\.(heic|heif)$/i, "") || "image";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}
