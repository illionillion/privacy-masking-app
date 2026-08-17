import { STAMP_FILE_NAMES } from "../constants";
import type { EditorStateSnapshot, StampRegion, StampType } from "../types";
import { generateUUID } from "./generateUUID";
import { resolveStampFileName } from "./pickStampImage";

/**
 * 検出結果からエディタの初期スナップショットを生成する
 *
 * @param detections - 顔検出結果
 * @param ocrRegions - OCR 結果
 * @param initialStampFileName - stamp-face の初期ファイル名
 */
export function createEditorSnapshotFromDetections(
  detections: Array<{ x: number; y: number; width: number; height: number }>,
  ocrRegions: Array<{ x: number; y: number; width: number; height: number; text: string }>,
  initialStampFileName: string
): EditorStateSnapshot {
  const faceRegions: StampRegion[] = detections.map((det) => {
    const id = generateUUID();
    return {
      id,
      x: det.x,
      y: det.y,
      width: det.width,
      height: det.height,
      stampType: "stamp-face" as StampType,
      stampFileName: resolveStampFileName({ id }, STAMP_FILE_NAMES),
      isEnabled: true,
      source: "face-detection" as const,
    };
  });
  const ocrMaskRegions: StampRegion[] = ocrRegions.map((region) => ({
    id: generateUUID(),
    x: region.x,
    y: region.y,
    width: region.width,
    height: region.height,
    stampType: "fill-black" as StampType,
    isEnabled: true,
    source: "ocr" as const,
    text: region.text,
  }));

  return {
    mode: "select",
    stampRegions: [...faceRegions, ...ocrMaskRegions],
    paintStrokes: [],
    selectedId: null,
    selectedStampType: "stamp-face",
    selectedPaintType: "fill-black",
    selectedStampFileName: initialStampFileName,
    brushSize: 20,
    cropRect: null,
  };
}
