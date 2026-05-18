import type {
  EditorMode,
  EditorStateSnapshot,
  PaintStroke,
  StampRegion,
  StampType,
} from "../types";
import { generateUUID } from "./generateUUID";

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
  const faceRegions: StampRegion[] = detections.map((det) => ({
    id: generateUUID(),
    x: det.x,
    y: det.y,
    width: det.width,
    height: det.height,
    stampType: "stamp-face" as StampType,
    isEnabled: true,
    source: "face-detection" as const,
  }));
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
    selectedStampFileName: initialStampFileName,
    brushSize: 20,
  };
}

/**
 * 空のエディタスナップショットを返す
 *
 * @param initialStampFileName - stamp-face の初期ファイル名
 */
export function createEmptyEditorSnapshot(initialStampFileName: string): EditorStateSnapshot {
  return {
    mode: "select" as EditorMode,
    stampRegions: [],
    paintStrokes: [] as PaintStroke[],
    selectedId: null,
    selectedStampType: "stamp-face",
    selectedStampFileName: initialStampFileName,
    brushSize: 20,
  };
}
