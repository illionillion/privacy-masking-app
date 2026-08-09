import { describe, expect, it } from "vitest";
import { getEditorStageTouchAction, shouldShowEditorTransformer } from "./editorCanvasInteraction";
import type { EditorMode, StampRegion } from "../types";

const stampRegion: StampRegion = {
  id: "stamp-1",
  x: 0,
  y: 0,
  width: 10,
  height: 10,
  stampType: "mosaic",
  isEnabled: true,
  source: "manual",
};

describe("shouldShowEditorTransformer", () => {
  it("選択モードではスタンプ・ペイントいずれも Transformer を表示する", () => {
    expect(shouldShowEditorTransformer("select", "stamp-1", [stampRegion])).toBe(true);
    expect(shouldShowEditorTransformer("select", "paint-1", [stampRegion])).toBe(true);
  });

  it("追加モードではスタンプ領域選択時のみ Transformer を表示する", () => {
    expect(shouldShowEditorTransformer("rect", "stamp-1", [stampRegion])).toBe(true);
    expect(shouldShowEditorTransformer("rect", "paint-1", [stampRegion])).toBe(false);
  });

  it("未選択・ペイントモードでは Transformer を表示しない", () => {
    expect(shouldShowEditorTransformer("rect", null, [stampRegion])).toBe(false);
    expect(shouldShowEditorTransformer("paint", "stamp-1", [stampRegion])).toBe(false);
  });

  it("トリミングモードではスタンプ Transformer を表示しない", () => {
    expect(shouldShowEditorTransformer("crop", "stamp-1", [stampRegion])).toBe(false);
  });
});

describe("getEditorStageTouchAction", () => {
  const modes: EditorMode[] = ["select", "rect", "paint", "crop"];

  it("ピン留めしない場合は全モードで none", () => {
    for (const mode of modes) {
      expect(getEditorStageTouchAction(false, mode)).toBe("none");
    }
  });

  it("ピン留め時は選択モードだけ pan-y、描画・crop は none", () => {
    expect(getEditorStageTouchAction(true, "select")).toBe("pan-y");
    expect(getEditorStageTouchAction(true, "rect")).toBe("none");
    expect(getEditorStageTouchAction(true, "paint")).toBe("none");
    expect(getEditorStageTouchAction(true, "crop")).toBe("none");
  });
});
