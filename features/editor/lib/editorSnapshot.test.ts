import { describe, it, expect } from "vitest";
import { createEditorSnapshotFromDetections } from "./editorSnapshot";

describe("createEditorSnapshotFromDetections", () => {
  it("顔検出と OCR からスタンプ領域を生成する", () => {
    const snapshot = createEditorSnapshotFromDetections(
      [{ x: 10, y: 20, width: 30, height: 40 }],
      [{ x: 1, y: 2, width: 3, height: 4, text: "tel" }],
      "stamp1.png"
    );

    expect(snapshot.stampRegions).toHaveLength(2);
    expect(snapshot.stampRegions[0]?.stampType).toBe("stamp-face");
    expect(snapshot.stampRegions[1]?.stampType).toBe("fill-black");
    expect(snapshot.paintStrokes).toHaveLength(0);
    expect(snapshot.selectedId).toBeNull();
  });
});
