import { describe, it, expect } from "vitest";
import { createEditorSnapshotFromDetections } from "@/features/editor/lib/editorSnapshot";
import { hasEditorContentChanges } from "./editorSnapshotDirty";

describe("hasEditorContentChanges", () => {
  const baseline = createEditorSnapshotFromDetections(
    [{ x: 0, y: 0, width: 10, height: 10 }],
    [],
    "a.png"
  );

  it("同一内容なら false", () => {
    const current = { ...baseline, selectedId: "region-1", mode: "paint" as const };
    expect(hasEditorContentChanges(current, baseline)).toBe(false);
  });

  it("領域が変われば true", () => {
    const current = {
      ...baseline,
      stampRegions: [...baseline.stampRegions, { ...baseline.stampRegions[0]!, id: "new" }],
    };
    expect(hasEditorContentChanges(current, baseline)).toBe(true);
  });

  it("cropRect だけ変われば true", () => {
    const current = {
      ...baseline,
      cropRect: { x: 10, y: 20, width: 80, height: 60 },
    };
    expect(hasEditorContentChanges(current, baseline)).toBe(true);
  });

  it("cropRect がどちらも null なら false", () => {
    const current = { ...baseline, cropRect: null, mode: "crop" as const };
    expect(hasEditorContentChanges(current, baseline)).toBe(false);
  });
});
