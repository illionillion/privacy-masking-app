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
});
