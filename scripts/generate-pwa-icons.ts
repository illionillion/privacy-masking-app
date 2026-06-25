import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PWA_BACKGROUND_COLOR } from "../lib/pwa";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const sourceIconPath = path.join(projectRoot, "public", "fusely-icon.png");
const outputDir = path.join(projectRoot, "public", "icons");

type IconSpec = {
  fileName: string;
  size: number;
};

/** 生成するアイコン定義 */
const ICON_SPECS: readonly IconSpec[] = [
  { fileName: "icon-192.png", size: 192 },
  { fileName: "icon-512.png", size: 512 },
  { fileName: "apple-touch-icon.png", size: 180 },
];

/** maskable アイコンのキャンバス一辺（px） */
const MASKABLE_CANVAS_SIZE = 512;

/** maskable のセーフゾーン比率（Android 推奨の 80%） */
const MASKABLE_SAFE_ZONE_RATIO = 0.8;

/**
 * 通常アイコンを正方形にリサイズして書き出す。
 *
 * @param sourceBuffer - 元画像バッファ
 * @param outputPath - 出力先パス
 * @param size - 一辺のピクセル数
 */
async function writeSquareIcon(
  sourceBuffer: Buffer,
  outputPath: string,
  size: number
): Promise<void> {
  await sharp(sourceBuffer)
    .resize(size, size, { fit: "cover" })
    .png({ compressionLevel: 9, palette: true })
    .toFile(outputPath);
}

/**
 * Android maskable 用アイコンを生成する（セーフゾーン内に収める）。
 *
 * @param sourceBuffer - 元画像バッファ
 * @param outputPath - 出力先パス
 * @param canvasSize - キャンバス一辺のピクセル数
 */
async function writeMaskableIcon(
  sourceBuffer: Buffer,
  outputPath: string,
  canvasSize: number
): Promise<void> {
  const innerSize = Math.round(canvasSize * MASKABLE_SAFE_ZONE_RATIO);
  const inset = Math.round((canvasSize - innerSize) / 2);
  const innerIcon = await sharp(sourceBuffer)
    .resize(innerSize, innerSize, { fit: "cover" })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: PWA_BACKGROUND_COLOR,
    },
  })
    .composite([{ input: innerIcon, left: inset, top: inset }])
    .png({ compressionLevel: 9, palette: true })
    .toFile(outputPath);
}

/**
 * `public/fusely-icon.png` から PWA 用アイコン一式を生成する。
 */
async function main(): Promise<void> {
  const sourceBuffer = await readFile(sourceIconPath);
  await mkdir(outputDir, { recursive: true });

  for (const { fileName, size } of ICON_SPECS) {
    const outputPath = path.join(outputDir, fileName);
    await writeSquareIcon(sourceBuffer, outputPath, size);
    console.log(`Generated ${path.relative(projectRoot, outputPath)}`);
  }

  const maskablePath = path.join(outputDir, "icon-512-maskable.png");
  await writeMaskableIcon(sourceBuffer, maskablePath, MASKABLE_CANVAS_SIZE);
  console.log(`Generated ${path.relative(projectRoot, maskablePath)}`);
}

await main();
