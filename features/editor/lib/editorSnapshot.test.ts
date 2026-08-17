import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { STAMP_FILE_NAMES } from "../constants";
import { createEditorSnapshotFromDetections } from "./editorSnapshot";
import { resolveStampFileName } from "./pickStampImage";

describe("createEditorSnapshotFromDetections", () => {
  beforeEach(() => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValueOnce("face-id").mockReturnValueOnce("ocr-id"),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("顔検出と OCR からスタンプ領域を生成する", () => {
    const snapshot = createEditorSnapshotFromDetections(
      [{ x: 10, y: 20, width: 30, height: 40 }],
      [{ x: 1, y: 2, width: 3, height: 4, text: "tel" }],
      "stamp1.png"
    );

    expect(snapshot.stampRegions).toHaveLength(2);
    expect(snapshot.stampRegions[0]?.stampType).toBe("stamp-face");
    expect(snapshot.stampRegions[0]?.stampFileName).toBe(
      resolveStampFileName({ id: "face-id" }, STAMP_FILE_NAMES)
    );
    expect(snapshot.stampRegions[1]?.stampType).toBe("fill-black");
    expect(snapshot.paintStrokes).toHaveLength(0);
    expect(snapshot.selectedPaintType).toBe("fill-black");
    expect(snapshot.selectedId).toBeNull();
    expect(snapshot.cropRect).toBeNull();
  });
});
