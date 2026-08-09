import { describe, it, expect, beforeEach } from "vitest";
import { createEditorSnapshotFromDetections } from "@/features/editor/lib/editorSnapshot";
import { getOrCreateEditorSnapshot, isEditorSnapshotUsable } from "./getOrCreateEditorSnapshot";
import {
  getImageEditorSnapshot,
  markImageEditorInitialized,
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
  beforeEach(() => {
    resetImageEditorCacheForTests();
  });

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

  it("crop モードは select に戻してキャッシュする", () => {
    const snapshot = createEditorSnapshotFromDetections(
      [{ x: 0, y: 0, width: 10, height: 10 }],
      [],
      "a.png"
    );
    persistImageEditorSnapshot("img-1", {
      ...snapshot,
      mode: "crop",
      cropRect: { x: 1, y: 2, width: 30, height: 40 },
    });
    expect(getImageEditorSnapshot("img-1")?.mode).toBe("select");
    expect(getImageEditorSnapshot("img-1")?.cropRect).toEqual({
      x: 1,
      y: 2,
      width: 30,
      height: 40,
    });
  });
});

describe("isEditorSnapshotUsable", () => {
  beforeEach(() => {
    resetImageEditorCacheForTests();
  });

  it("未初期化で検出があるのにスタンプが空なら unusable", () => {
    const image = createImage();
    const empty = createEditorSnapshotFromDetections([], [], "a.png");
    expect(isEditorSnapshotUsable(image, empty)).toBe(false);
  });

  it("初期化済みなら領域が空でも usable", () => {
    const image = createImage();
    const empty = createEditorSnapshotFromDetections([], [], "a.png");
    markImageEditorInitialized(image.id);
    expect(isEditorSnapshotUsable(image, empty)).toBe(true);
  });

  it("初期化済みの空キャッシュは再オープン時も検出から再生成しない", () => {
    const image = createImage();
    const empty = createEditorSnapshotFromDetections([], [], "a.png");
    setImageEditorSnapshot(image.id, empty);
    markImageEditorInitialized(image.id);

    const snapshot = getOrCreateEditorSnapshot({
      id: image.id,
      detections: image.detections,
      ocrRegions: image.ocrRegions,
    });
    expect(snapshot.stampRegions).toHaveLength(0);
  });
});
