import { describe, expect, it } from "vitest";
import { getEditorViewportHintText } from "./editorViewportHintText";

describe("getEditorViewportHintText", () => {
  it("PC・通常レイアウトではホイールと Space パンを案内する", () => {
    expect(getEditorViewportHintText({ pinViewportControls: false, isNarrowViewport: false })).toBe(
      "ホイールで拡大/縮小 · 拡大時: 空白／Space+ドラッグで移動"
    );
  });

  it("PC・モーダルでは Ctrl/Cmd+ホイールを案内する", () => {
    expect(getEditorViewportHintText({ pinViewportControls: true, isNarrowViewport: false })).toBe(
      "Ctrl/Cmd+ホイールで拡大/縮小 · 拡大時: 空白／Space+ドラッグで移動"
    );
  });

  it("SP では 2 本指ピンチと空白ドラッグを案内する", () => {
    expect(getEditorViewportHintText({ pinViewportControls: true, isNarrowViewport: true })).toBe(
      "2本指ピンチで拡大/縮小 · 拡大時: 空白をドラッグで移動"
    );
  });
});
