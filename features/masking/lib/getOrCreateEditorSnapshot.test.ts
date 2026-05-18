import { describe, it, expect, beforeEach } from "vitest";
import { createEditorSnapshotFromDetections } from "@/features/editor/lib/editorSnapshot";
import { getOrCreateEditorSnapshot, isEditorSnapshotUsable } from "./getOrCreateEditorSnapshot";
import {
  getImageEditorSnapshot,
  persistImageEditorSnapshot,
  resetImageEditorCacheForTests,
  setImageEditorSnapshot,
} from "./imageEditorCache";
import type { MaskingImageItem } from "../types";

function createImage(overrides: Partial<MaskingImageItem> = {}): MaskingImageItem {
  return {
    id: "img-1",
    name: "test.png",
    size: 1024,
    imageUrl: "blob:test",
    detections: [{ x: 1, y: 2, width: 3, height: 4, score: 0.9 }],
    ocrRegions: [],
    maskedBlobUrl: null,
    isProcessing: false,
    processingError: false,
    ...overrides,
  };
}

describe("getOrCreateEditorSnapshot", () => {
  beforeEach(() => {
    resetImageEditorCacheForTests();
  });

  it("空キャッシュは検出結果から再生成する", () => {
    const empty = createEditorSnapshotFromDetections([], [], "a.png");
    setImageEditorSnapshot("img-1", empty);

    const snapshot = getOrCreateEditorSnapshot(createImage());
    expect(snapshot.stampRegions.length).toBe(1);
  });

  it("有効なキャッシュはそのまま返す", () => {
    const valid = createEditorSnapshotFromDetections(
      [{ x: 0, y: 0, width: 10, height: 10 }],
      [],
      "a.png"
    );
    setImageEditorSnapshot("img-1", valid);

    const snapshot = getOrCreateEditorSnapshot(createImage());
    expect(snapshot).toBe(valid);
  });
});

describe("persistImageEditorSnapshot", () => {
  it("selectedId を null にしてキャッシュする", () => {
    const withSelection = createEditorSnapshotFromDetections(
      [{ x: 0, y: 0, width: 10, height: 10 }],
      [],
      "a.png"
    );
    withSelection.selectedId = "region-1";
    persistImageEditorSnapshot("img-1", withSelection);
    expect(getImageEditorSnapshot("img-1")?.selectedId).toBeNull();
    expect(getImageEditorSnapshot("img-1")?.stampRegions).toHaveLength(1);
  });
});

describe("isEditorSnapshotUsable", () => {
  it("検出があるのにスタンプが空なら unusable", () => {
    const image = createImage();
    const empty = createEditorSnapshotFromDetections([], [], "a.png");
    expect(isEditorSnapshotUsable(image, empty)).toBe(false);
  });
});
